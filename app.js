/* Add future screens to this registry and call TEKO.navigate('screenId').
   Works over file:// without a build step, modules, server, or external fonts. */
(() => {
  'use strict';
  const app = document.getElementById('app');
  const splash = document.getElementById('splash');
  const profile = document.getElementById('profile');
  const settings = document.getElementById('settings');
  const settingsOpen = document.getElementById('settings-open');
  const settingsClose = document.getElementById('settings-close');
  const temperature = document.getElementById('temperature');
  const temperatureOpen = document.getElementById('temperature-open');
  const weatherSettings = document.getElementById('weather-settings');
  const light = document.getElementById('light');
  const lightOpen = document.getElementById('light-open');
  const lightSettings = document.getElementById('light-settings');
  const water = document.getElementById('water');
  const waterOpen = document.getElementById('water-open');
  const screens = { profile, temperature, light, water };
  const detailPages = {
    temperature: { element: temperature, opener: temperatureOpen, settings: weatherSettings, back: document.getElementById('weather-back') },
    light: { element: light, opener: lightOpen, settings: lightSettings, back: document.getElementById('light-back') },
    water: { element: water, opener: waterOpen, settings: document.getElementById('water-settings'), back: document.getElementById('water-back') },
  };
  let weatherTouch = null;
  let weatherLockedUntil = 0;
  let weatherHistoryActive = false;
  let current = 'splash';
  let closeTimer;
  let gestureCount = 0;
  let view = 'intro';
  let lockedUntil = 0;
  let pairDirection = 0;
  let touchStart = null;
  let wheelDistance = 0;
  let wheelDirection = 0;
  let lastWheelAt = -Infinity;
  let wheelCounted = false;
  let lastNotchAt = -Infinity;
  const gestureStatus = document.getElementById('gesture-status');
  const details = document.getElementById('plant-details');
  const motion = window.TekoMotion?.create({
    container: document.getElementById('bobo-motion'),
    video: document.getElementById('bobo-video'),
    canvas: document.getElementById('bobo-canvas'),
    fallback: document.getElementById('bobo-fallback'),
  });
  const orbit = window.TekoOrbit?.create({ back: document.getElementById('orbit-back'), front: document.getElementById('orbit-front') });
  const number3d = window.TekoNumber3D?.create({
    stage: document.getElementById('temperature-number'), canvas: document.getElementById('number-canvas'),
    poster: document.getElementById('number-poster'), face: document.getElementById('number-face'), degree: document.getElementById('number-degree'),
  });
  const sun3d = window.TekoSun3D?.create({ stage: document.getElementById('light-sun-stage'), canvas: document.getElementById('sun-canvas'), texture: document.getElementById('sun-texture'), relief: document.getElementById('sun-relief') });
  const waterTouch = window.TekoWaterTouch?.create({ stage: document.getElementById('water-drop-stage'), image: document.getElementById('water-jelly-image'), particles: document.getElementById('water-particles'), ripple: document.getElementById('water-ripple') });
  const lightEffects = window.TekoLightEffects?.create({ whites: ['light-float-one','light-float-two'].map(id=>document.getElementById(id)), clip: document.getElementById('light-graph-reveal'), marker: document.getElementById('light-graph-marker'), line: document.getElementById('light-graph-line'), fill: document.getElementById('light-graph-area') });
  const temperatureFloat = window.TekoTemperatureFloat?.create({nodes:['temperature-white-one','temperature-white-two','temperature-blue-one','temperature-blue-two'].map(id=>document.getElementById(id))});
  const temperatureGraph = window.TekoLightEffects?.create({clip:document.getElementById('temperature-graph-reveal'),marker:document.getElementById('temperature-graph-marker'),line:document.getElementById('temperature-graph-line'),graph:{points:window.TekoTemperatureGraphPoints,left:128,right:704,bottom:670}});
  const waterDecor = window.TekoWaterDecor?.create({ beads: ['water-orbit-large','water-orbit-small'].map(id=>document.getElementById(id)), frontBeads: ['water-orbit-large-front','water-orbit-small-front'].map(id=>document.getElementById(id)), whites: ['water-float-one','water-float-two','water-float-three'].map(id=>document.getElementById(id)), arm: document.getElementById('water-wave-arm') });

  function canReveal() {
    return current === 'profile' && settings.hidden && performance.now() >= lockedUntil;
  }

  function revealDashboard() {
    if (!canReveal() || view === 'dashboard') return;
    view = 'dashboard';
    gestureCount = 0;
    pairDirection = 0;
    lockedUntil = performance.now() + 2100;
    profile.classList.remove('is-details');
    profile.classList.add('is-dashboard');
    temperatureOpen.disabled = false;
    lightOpen.disabled = false;
    waterOpen.disabled = false;
    details.setAttribute('aria-hidden', 'true');
    details.inert = true;
    orbit?.start(2100);
    profile.querySelectorAll('.dashboard-layer').forEach(layer => layer.setAttribute('aria-hidden', 'false'));
    gestureStatus.textContent = '온도 25도. 빛 충분해요. 물 좋아요. 오늘도 잘 지내고 있어요. 현재 오후 2시 40분.';
  }

  function showDetails() {
    if (!canReveal() || view !== 'dashboard') return;
    view = 'details';
    gestureCount = 0;
    pairDirection = 0;
    lockedUntil = performance.now() + 1850;
    profile.classList.add('has-details');
    profile.classList.remove('is-dashboard');
    profile.classList.add('is-details');
    temperatureOpen.disabled = true;
    lightOpen.disabled = true;
    waterOpen.disabled = true;
    orbit?.stop();
    details.setAttribute('aria-hidden', 'false');
    details.inert = false;
    profile.querySelectorAll('.dashboard-layer').forEach(layer => layer.setAttribute('aria-hidden', 'true'));
    gestureStatus.textContent = 'Bobo 상세 프로필. 생년월일 2026년 10월 20일. 현재 상태 매우 좋음, 조금 더움. 남긴 메모, 물을 마시고 싶은데.';
  }

  function countUpGesture(direction = 1) {
    if (!canReveal()) return;
    if (view === 'intro' && direction < 0) return;
    if (pairDirection && direction !== pairDirection) gestureCount = 0;
    pairDirection = direction;
    gestureCount += 1;
    if (gestureCount >= 2) {
      if (view === 'dashboard') showDetails();
      else revealDashboard();
    } else {
      gestureStatus.textContent = view === 'dashboard'
        ? '한 번 더 스와이프하면 상세 프로필이 나타납니다.'
        : '한 번 더 스와이프하면 메인 상태 화면이 나타납니다.';
    }
  }

  function resetDashboard() {
    gestureCount = 0;
    view = 'intro';
    lockedUntil = 0;
    pairDirection = 0;
    touchStart = null;
    wheelDistance = 0;
    lastWheelAt = -Infinity;
    lastNotchAt = -Infinity;
    wheelDirection = 0;
    wheelCounted = false;
    profile.classList.remove('is-dashboard');
    profile.classList.remove('is-details');
    profile.classList.remove('has-details');
    temperatureOpen.disabled = true;
    lightOpen.disabled = true;
    waterOpen.disabled = true;
    details.setAttribute('aria-hidden', 'true');
    details.inert = true;
    orbit?.stop(true);
    profile.querySelectorAll('.dashboard-layer').forEach(layer => layer.setAttribute('aria-hidden', 'true'));
    gestureStatus.textContent = '';
  }

  function navigate(id) {
    if (detailPages[id]) { openWeather(id); return; }
    if (id === 'profile' && detailPages[current]) { closeWeather(); return; }
    const next = screens[id];
    if (!next || current === id) return;
    Object.entries(screens).forEach(([key, element]) => {
      const active = key === id;
      element.classList.toggle('is-active', active);
      element.inert = !active;
      element.setAttribute('aria-hidden', String(!active));
    });
    current = id;
    app.classList.add('has-started');
    if (id === 'profile') motion?.start(true);
    else motion?.stop();
    splash.classList.add('is-leaving');
    splash.disabled = true;
    splash.setAttribute('aria-hidden', 'true');
    document.querySelector('meta[name="theme-color"]').content = '#ffffff';
    settingsOpen.focus({ preventScroll: true });
  }

  function clearGesturePair() {
    gestureCount = 0; pairDirection = 0; touchStart = null;
    wheelDistance = 0; wheelCounted = false;
    lastWheelAt = -Infinity; lastNotchAt = -Infinity;
  }

  function openTemperature() { openWeather('temperature'); }
  function openLight() { openWeather('light'); }
  function openWater() { openWeather('water'); }
  function closeTemperature(options) { if (current === 'temperature') closeWeather(options); }
  function closeLight(options) { if (current === 'light') closeWeather(options); }
  function closeWater(options) { if (current === 'water') closeWeather(options); }

  function openWeather(id) {
    if (!canReveal() || view !== 'dashboard') return;
    const page = detailPages[id].element;
    current = id;
    weatherLockedUntil = performance.now() + 700;
    clearGesturePair();
    profile.classList.add('is-weather-behind');
    profile.inert = true;
    profile.setAttribute('aria-hidden','true');
    page.classList.add('is-preparing');
    page.classList.remove('is-exiting');
    page.classList.remove('is-dragging');
    page.style.removeProperty('--weather-drag');
    // Reset the hidden page to its centred blur pose on every re-entry.
    void page.offsetWidth;
    page.classList.remove('is-preparing');
    page.classList.add('is-active');
    page.inert = false;
    page.setAttribute('aria-hidden','false');
    page.focus({ preventScroll: true });
    if (id === 'temperature') number3d?.start(true);
    if (id === 'temperature') temperatureFloat?.start();
    if (id === 'temperature') temperatureGraph?.start(true);
    if (id === 'light') sun3d?.start(true);
    if (id === 'light') lightEffects?.start(true);
    if (id === 'water') waterTouch?.start();
    if (id === 'water') waterDecor?.start();
    try {
      if (window.history) {
        window.history.pushState({ tekoPage: id }, '', `#${id}`);
        weatherHistoryActive = true;
      }
    } catch (_) { /* Local file hosts may restrict history; edge drag still works. */ }
    orbit?.stop();
  }

  function closeWeather(options) {
    const fromHistory = options?.fromHistory === true;
    if (!detailPages[current] || !settings.hidden || (!fromHistory && performance.now() < weatherLockedUntil)) return;
    const id = current, entry = detailPages[id], page = entry.element;
    // Continue from the displayed pose even if the entrance is still finishing.
    if (window.getComputedStyle) page.querySelectorAll('.weather-enter-first, .weather-enter-later').forEach(element => {
      const pose = window.getComputedStyle(element);
      element.style.setProperty('--weather-exit-opacity', pose.opacity);
      element.style.setProperty('--weather-exit-transform', pose.transform);
    });
    weatherTouch = null;
    if (id === 'temperature') number3d?.stop();
    if (id === 'temperature') temperatureFloat?.stop();
    if (id === 'temperature') temperatureGraph?.stop();
    if (id === 'light') sun3d?.stop();
    if (id === 'light') lightEffects?.stop();
    if (id === 'water') waterTouch?.stop();
    if (id === 'water') waterDecor?.stop();
    current = 'profile';
    clearGesturePair();
    lockedUntil = performance.now() + 1100;
    page.classList.remove('is-dragging');
    page.classList.add('is-exiting');
    page.style.removeProperty('--weather-drag');
    page.classList.remove('is-active');
    page.inert = true;
    page.setAttribute('aria-hidden','true');
    profile.classList.remove('is-weather-behind');
    profile.inert = false;
    profile.setAttribute('aria-hidden','false');
    entry.opener.focus({ preventScroll: true });
    orbit?.start(1100);
    const shouldGoBack = !fromHistory && weatherHistoryActive && window.history?.state?.tekoPage === id;
    weatherHistoryActive = false;
    if (shouldGoBack) window.history.back();
  }

  function replay() {
    closeSettings(false);
    resetDashboard();
    current = 'splash';
    app.classList.remove('has-started');
    number3d?.stop(true);
    temperatureFloat?.stop(true);
    temperatureGraph?.stop(true);
    sun3d?.stop(true);
    waterTouch?.stop();
    lightEffects?.stop(true);
    waterDecor?.stop(true);
    if (weatherHistoryActive && detailPages[window.history?.state?.tekoPage]) window.history.back();
    weatherHistoryActive = false;
    weatherTouch = null;
    Object.values(detailPages).forEach(({ element: page }) => {
      page.classList.remove('is-active');
      page.classList.remove('is-dragging');
      page.classList.remove('is-exiting');
      page.style.removeProperty('--weather-drag');
      page.inert = true;
      page.setAttribute('aria-hidden','true');
    });
    profile.classList.remove('is-weather-behind');
    motion?.stop(true);
    profile.classList.remove('is-active');
    profile.inert = true;
    profile.setAttribute('aria-hidden', 'true');
    splash.classList.remove('is-leaving');
    splash.disabled = false;
    splash.removeAttribute('aria-hidden');
    app.classList.remove('is-intro');
    void app.offsetWidth;
    app.classList.add('is-intro');
    document.querySelector('meta[name="theme-color"]').content = '#00ffbc';
    splash.focus({ preventScroll: true });
  }

  function openSettings() {
    clearTimeout(closeTimer);
    settings.hidden = false;
    requestAnimationFrame(() => {
      settings.classList.add('is-open');
      settingsClose.focus({ preventScroll: true });
    });
  }
  function closeSettings(restoreFocus = true) {
    settings.classList.remove('is-open');
    if (restoreFocus) {
      closeTimer = setTimeout(() => { settings.hidden = true; }, 500);
      (detailPages[current]?.settings || settingsOpen).focus({ preventScroll: true });
    } else {
      clearTimeout(closeTimer);
      settings.hidden = true;
    }
  }

  splash.addEventListener('click', () => navigate('profile'));
  window.addEventListener?.('popstate', () => {
    if (detailPages[current]) closeWeather({ fromHistory: true });
  });
  Object.entries(detailPages).forEach(([id, entry]) => {
    const page = entry.element;
    entry.opener.addEventListener('click', () => openWeather(id));
    entry.back.addEventListener('click', closeWeather);
    entry.settings.addEventListener('click', openSettings);
  page.addEventListener('pointerdown', event => {
    if (current !== id || !settings.hidden || !event.isPrimary || performance.now() < weatherLockedUntil) return;
    const bounds = page.getBoundingClientRect();
    const edgeWidth = Math.min(44,bounds.width*.1);
    if (event.clientX-bounds.left > edgeWidth || event.clientX < bounds.left) return;
    weatherTouch = { x:event.clientX, y:event.clientY, id:event.pointerId, width:bounds.width };
    page.setPointerCapture?.(event.pointerId);
  });
  page.addEventListener('pointermove', event => {
    if (!weatherTouch || weatherTouch.id !== event.pointerId) return;
    const dx=event.clientX-weatherTouch.x, dy=Math.abs(event.clientY-weatherTouch.y);
    if (dx > 8 && dx > dy*1.2) {
      page.classList.add('is-dragging');
      page.style.setProperty('--weather-drag',`${Math.min(dx,weatherTouch.width*.85)}px`);
    }
  });
  page.addEventListener('pointerup', event => {
    if (!weatherTouch || weatherTouch.id !== event.pointerId) return;
    const dx=event.clientX-weatherTouch.x, dy=Math.abs(event.clientY-weatherTouch.y);
    const threshold=Math.max(48,weatherTouch.width*.15);
    weatherTouch=null;
    page.classList.remove('is-dragging');
    if (dx>=threshold && dx>dy*1.3) closeWeather();
    else page.style.removeProperty('--weather-drag');
  });
  page.addEventListener('pointercancel', () => {
    weatherTouch=null;
    page.classList.remove('is-dragging');
    page.style.removeProperty('--weather-drag');
  });
  });
  profile.addEventListener('pointerdown', event => {
    if (!canReveal() || event.pointerType === 'mouse' || !event.isPrimary || event.target.closest('button')) return;
    touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    profile.setPointerCapture?.(event.pointerId);
  });
  profile.addEventListener('pointerup', event => {
    if (!touchStart || touchStart.id !== event.pointerId) return;
    const dy = touchStart.y - event.clientY;
    const dx = Math.abs(touchStart.x - event.clientX);
    touchStart = null;
    if (Math.abs(dy) >= 40 && Math.abs(dy) > dx * 1.3) countUpGesture(Math.sign(dy));
  });
  profile.addEventListener('pointercancel', () => { touchStart = null; });

  profile.addEventListener('wheel', event => {
    if (!canReveal() || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? profile.clientHeight : 1);
    if (!delta) return;
    const direction = Math.sign(delta);
    if (now - lastWheelAt > 180 || direction !== wheelDirection) {
      wheelDistance = 0;
      wheelCounted = false;
    }
    wheelDirection = direction;
    lastWheelAt = now;
    // Both wheel directions are accepted as 'scroll up' varies by device settings.
    // Discrete wheel notches count separately; trackpad inertia belongs to one gesture.
    const notch = event.deltaMode === 1 || Math.abs(event.deltaY) === 100 || Math.abs(event.deltaY) === 120;
    if (notch) {
      if (now - lastNotchAt >= 70) {
        countUpGesture(view === 'intro' ? 1 : direction);
        lastNotchAt = now;
      }
      wheelCounted = true;
      return;
    }
    wheelDistance += Math.abs(delta);
    if (!wheelCounted && wheelDistance >= 36) {
      wheelCounted = true;
      countUpGesture(view === 'intro' ? 1 : direction);
    }
  }, { passive: false });
  settingsOpen.addEventListener('click', openSettings);
  settingsClose.addEventListener('click', () => closeSettings());
  settings.addEventListener('click', event => { if (event.target === settings) closeSettings(); });
  document.getElementById('replay').addEventListener('click', replay);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { motion?.stop(); orbit?.stop(); number3d?.stop(); sun3d?.stop(); waterTouch?.stop(); waterDecor?.stop(); lightEffects?.stop(); temperatureFloat?.stop(); temperatureGraph?.stop(); }
    else if (current === 'profile') {
      motion?.start();
      if (view === 'dashboard') orbit?.start();
    } else if (detailPages[current]) { motion?.start(); if (current === 'temperature') {number3d?.start();temperatureFloat?.start();temperatureGraph?.start();} if (current === 'light') {sun3d?.start();lightEffects?.start();} if (current === 'water') {waterTouch?.start();waterDecor?.start();} }
  });
  document.addEventListener('keydown', event => {
    if (detailPages[current] && settings.hidden && ['Escape','ArrowLeft'].includes(event.key)) {
      closeWeather(); event.preventDefault(); return;
    }
    if (settings.hidden && canReveal() && ['ArrowUp', 'ArrowDown', 'PageDown'].includes(event.key)) {
      if (!event.repeat) countUpGesture(event.key === 'ArrowDown' ? -1 : 1);
      event.preventDefault();
      return;
    }
    if (settings.hidden) return;
    if (event.key === 'Escape') closeSettings();
    if (event.key === 'Tab') {
      event.preventDefault();
      const replayButton = document.getElementById('replay');
      (document.activeElement === settingsClose ? replayButton : settingsClose).focus();
    }
  });

  window.TEKO = { navigate, replay, screens, revealDashboard, showDetails, openTemperature, closeTemperature, openLight, closeLight, openWater, closeWater,
    get currentScreen() { return current; },
    get profileView() { return view; },
    get detailsVisible() { return view === 'details'; },
    get dashboardVisible() { return profile.classList.contains('is-dashboard'); } };
  // Decode supplied artwork before beginning the background → logo sequence.
  Promise.all(Array.from(document.images, image => image.decode().catch(() => {})))
    .then(() => requestAnimationFrame(() => app.classList.add('is-intro')));
})();
