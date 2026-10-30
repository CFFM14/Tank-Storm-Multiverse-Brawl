/* 手机操作：使用 Pointer Events 支持方向、开火、道具多指并按。 */
function initMobileControls(api) {
  const enabled = matchMedia('(any-pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  if (!enabled) return;
  document.documentElement.classList.add('touch-game');
  const panel = document.createElement('nav');
  panel.id = 'touchControls';
  panel.setAttribute('aria-label', '手机游戏操作');
  panel.innerHTML = `<div class="touch-note">建议横屏 · 方向键控制车身 · 开火同时使用道具</div>
    <div class="touch-pad"><button data-action="up" aria-label="前进">▲</button><button data-action="left" aria-label="左转">◀</button><button data-action="down" aria-label="后退">▼</button><button data-action="right" aria-label="右转">▶</button></div>
    <div class="touch-actions"><button data-action="pause">暂停</button><button data-action="build">建造</button><button data-action="fire" class="touch-fire">开火</button></div>`;
  document.body.append(panel);
  const active = new Map();
  function emit(code, down) {
    window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {code, key: code === 'Escape' ? 'Escape' : code, bubbles: true}));
  }
  function release(id) {
    const entry = active.get(id);
    if (!entry) return;
    active.delete(id);
    if (![...active.values()].some(v => v.code === entry.code)) emit(entry.code, false);
    if (![...active.values()].some(v => v.button === entry.button)) entry.button.classList.remove('held');
  }
  const clear = () => [...active.keys()].forEach(release);
  panel.querySelectorAll('button').forEach(button => {
    button.type = 'button';
    button.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (button.dataset.action === 'build') { document.getElementById('btnBuildGen').click(); return; }
      api.keyboard();
      const sc = api.scheme(), map = api.map(sc), slots = api.slots(sc);
      const action = button.dataset.action;
      const code = action === 'pause' ? 'Escape' : action === 'build' ? slots.build : action.startsWith('slot') ? slots.slots[+action.slice(4)] : action === 'fire' ? map.fire[0] : map[action];
      active.set(e.pointerId, {code, button});
      button.setPointerCapture(e.pointerId);
      button.classList.add('held');
      emit(code, true);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => button.addEventListener(name, e => release(e.pointerId)));
    button.addEventListener('contextmenu', e => e.preventDefault());
  });
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  document.getElementById('cv').addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') api.place(e);
  });
  let previous = '';
  function sync() {
    const mode = api.state().mode;
    const visible = ['playing', 'countdown', 'paused'].includes(mode);
    if (previous !== mode) { clear(); previous = mode; }
    panel.hidden = !visible;
    document.documentElement.classList.toggle('touch-playing', visible);
    panel.querySelector('[data-action="pause"]').textContent = mode === 'paused' ? '继续' : '暂停';
    requestAnimationFrame(sync);
  }
  sync();
}
