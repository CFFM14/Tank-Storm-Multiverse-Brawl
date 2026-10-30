/* 独立的横屏触屏界面。桌面设备不创建这些元素，不改变游戏操作。 */
function initMobileControls(api) {
  if (!matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) > 900 || Math.max(screen.width, screen.height) > 1200) return;
  document.documentElement.classList.add('touch-game');
  const root = document.createElement('div'); root.id = 'mobileUI';
  root.innerHTML = `
    <section id="mobileRotate"><div class="rotate-icon">↻</div><h2>横过手机，准备出击</h2><p>横屏下使用左侧摇杆移动，右侧按钮开火</p><button data-do="fullscreen">进入全屏横屏</button><small>也可以开启系统自动旋转后横放手机</small></section>
    <section id="mobileMenu" class="mobile-screen">
      <header><div><span class="mobile-eyebrow">TANK STORM · MOBILE</span><h1>坦克<span>风云</span><small>多元乱斗</small></h1></div><button class="mobile-quiet" data-do="fullscreen">全屏 ↗</button></header>
      <div class="mobile-menu-body"><aside><b>指尖上的<br>坦克战场</b><p>左手拖动，控制方向。<br>右手开火，边走边战。</p><div class="mobile-legend">◎ 左侧落指后拖动<br>◉ 右手开火<br>↗ 子弹反弹，小心自己</div></aside>
      <div class="mobile-modes">
        <button data-mode="duel"><span>01 / DUEL</span><b>单挑电脑</b><small>一对一，练习走位与反弹</small><i aria-hidden="true">↗</i></button>
        <button data-mode="brawl"><span>02 / BRAWL</span><b>人机混战</b><small>你和两台电脑，各自为战</small><i aria-hidden="true">↗</i></button>
        <button data-mode="hunt"><span>03 / SURVIVE</span><b>人机围剿</b><small>两台电脑联手，挑战突围</small><i aria-hidden="true">↗</i></button>
        <button data-mode="siege"><span>04 / DEFEND</span><b>丧尸围城</b><small>守住工厂，抵挡十二波进攻</small><label>人机队友 <select id="mobileAllies" aria-label="围城人机队友数量"><option value="0">不带队友</option><option value="1">1 名</option><option value="2">2 名</option></select></label><i aria-hidden="true">↗</i></button>
      </div></div><footer>单人游玩 · 摇杆驾驶 · 拾取道具后开火发动</footer>
    </section>
    <header id="mobileBar"><b>坦克风云</b><span id="mobileStatus"></span><button data-do="fullscreen" aria-label="全屏">↗</button><button data-do="pause">暂停 Ⅱ</button></header>
    <nav id="touchControls" aria-label="触屏操作"><div id="mobileStickZone" role="application" aria-label="浮动摇杆：在左半屏按下后拖动控制方向"><div id="mobileStick" aria-hidden="true"><span class="stick-cross"></span><span id="mobileKnob"></span><small>左侧按住拖动</small></div></div><div class="mobile-right"><button id="mobileBuild" data-do="build">建造</button><button id="mobileFire" aria-label="开火，按住持续射击">开火<span>FIRE</span></button></div></nav>
    <section id="mobileDialog" class="mobile-screen"><div class="mobile-dialog-card"><span class="mobile-eyebrow">TANK STORM</span><h2 id="mobileDialogTitle"></h2><p id="mobileDialogText"></p><div><button id="mobileContinue">继续战斗</button><button class="mobile-quiet" data-do="home">返回首页</button></div></div></section>`;
  document.body.append(root);
  let vector = {x:0,y:0}, stickId = null, fireId = null, previous = '', lastStatus = '';
  const zone = root.querySelector('#mobileStickZone');
  const stick = root.querySelector('#mobileStick'), knob = root.querySelector('#mobileKnob');
  const fire = root.querySelector('#mobileFire');
  let origin = null;
  function releaseStick() {
    const id = stickId;
    stickId = null; origin = null; vector = {x:0,y:0};
    if (id !== null && zone.hasPointerCapture(id)) zone.releasePointerCapture(id);
    stick.classList.remove('active');
    stick.removeAttribute('style');
    knob.style.transform = 'translate(-50%,-50%)';
  }
  function reset() { releaseStick();fireId=null;fire.classList.remove('held');api.drive(0,0,false); }
  function move(e) {
    if (!origin) return;
    const radius = stick.getBoundingClientRect().width * .34;
    let x=(e.clientX-origin.x)/radius,y=(e.clientY-origin.y)/radius;
    const length=Math.hypot(x,y); if(length>1){x/=length;y/=length;}
    vector={x,y};knob.style.transform=`translate(calc(-50% + ${x*radius}px),calc(-50% + ${y*radius}px))`;
  }
  zone.addEventListener('pointerdown',e=>{
    if(stickId!==null || api.state().placing)return;
    e.preventDefault();stickId=e.pointerId;origin={x:e.clientX,y:e.clientY};
    vector={x:0,y:0};
    stick.style.left=origin.x+'px';stick.style.top=origin.y+'px';stick.style.bottom='auto';stick.style.transform='translate(-50%,-50%)';
    stick.classList.add('active');zone.setPointerCapture(e.pointerId);
  });
  zone.addEventListener('pointermove',e=>{if(e.pointerId===stickId){e.preventDefault();move(e);}});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>zone.addEventListener(type,e=>{if(e.pointerId===stickId)releaseStick();}));
  fire.addEventListener('pointerdown',e=>{e.preventDefault();if(fireId!==null)return;fireId=e.pointerId;fire.setPointerCapture(e.pointerId);fire.classList.add('held');});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>fire.addEventListener(type,e=>{if(e.pointerId===fireId){fireId=null;fire.classList.remove('held');}}));
  async function fullscreen(){try {if(!document.fullscreenElement) await document.documentElement.requestFullscreen();try {await screen.orientation.lock('landscape');}catch(_) {}}catch(_) {}}
  root.querySelectorAll('[data-do]').forEach(button=>button.addEventListener('click',()=>{reset();const action=button.dataset.do;if(action==='fullscreen')fullscreen();else api[action]();}));
  root.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',e=>{if(e.target.closest('select,label'))return;reset();api.start(button.dataset.mode,+root.querySelector('#mobileAllies').value);}));
  root.querySelector('#mobileContinue').addEventListener('click',()=>{reset();if(api.state().mode==='paused')api.pause();else api.next();});
  root.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('blur',reset);window.addEventListener('orientationchange',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  document.querySelector('#cv').addEventListener('pointerdown',e=>{if(e.pointerType==='touch')api.place(e);});
  function sync(){
    const s=api.state(), mode=s.mode, portrait=innerHeight>innerWidth;
    if(mode!==previous){if(!(['playing','countdown'].includes(mode)&&['playing','countdown'].includes(previous)))reset();previous=mode;}
    if(portrait&&mode==='playing')api.pause();
    const menu=mode==='menu', dialog=['paused','result','matchover'].includes(mode);
    root.querySelector('#mobileMenu').hidden=!menu;
    root.querySelector('#mobileDialog').hidden=!dialog;
    root.querySelector('#mobileBar').hidden=menu;
    root.querySelector('#touchControls').hidden=menu||dialog;
    root.querySelector('#mobileBuild').hidden=s.gameMode!=='siege'||!!s.siege?.gen.built;
    root.querySelector('#mobileBuild').textContent=s.placing?'取消建造':'建造';
    zone.hidden=!!s.placing;
    if(dialog){root.querySelector('#mobileDialogTitle').textContent=mode==='paused'?'休整片刻':s.gameMode==='siege'?(s.siege?.factory.hp>0?'守城战报':'工厂失守'):'回合结束';root.querySelector('#mobileDialogText').textContent=mode==='paused'?'准备好后，继续你的战斗。':s.gameMode==='siege'?`坚持到第 ${s.siege?.wave||1} 波 · 击杀 ${s.siege?.kills||0}`:s.roundDraw?'势均力敌，这一局平手。':`本局胜者：${s.roundWinners?.map(p=>p.name||('P'+(p.id+1))).join('、')||'待定'}`;root.querySelector('#mobileContinue').textContent=mode==='paused'?'继续战斗':s.gameMode==='siege'?'再战一局':'下一回合';}
    const status=s.gameMode==='siege'?`第 ${s.siege?.wave||1} / 12 波 · 废铁 ${s.siege?.scrap||0}`:`第 ${s.round} 回合 · ${s.players.filter(p=>!p.bot||!p.zombie).filter(p=>p.alive).length} 台存活`;
    const hero=s.players.find(p=>!p.bot);const label=`${hero?'生命 '+Math.max(0,hero.hp)+' · ':''}${status}${s.placing?' · 点地图放置':hero?.slots?.some(Boolean)?' · 已装填道具':''}`;
    if(label!==lastStatus){root.querySelector('#mobileStatus').textContent=label;lastStatus=label;}
    if(!menu&&!dialog&&!portrait&&!document.hidden)api.drive(vector.x,vector.y,fireId!==null);else api.drive(0,0,false);
    requestAnimationFrame(sync);
  }
  sync();
}
