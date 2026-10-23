// Local demo only: no requests, messages, or changes to the live AI chat.
(() => {
  'use strict';
  const root = document.getElementById('tc-phone-demo');
  if (!root) return;

  const panels = Array.from(root.querySelectorAll('[data-panel]'));
  const steps = Array.from(root.querySelectorAll('[data-step-button]'));
  const playButton = root.querySelector('[data-play]');
  const progress = root.querySelector('.tc-progress span');
  const announcement = root.querySelector('[data-announcement]');
  const typingText = root.querySelector('[data-typewriter]');
  const fullQuery = 'Я учитель физики. Хочу открыть кружок робототехники.';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const labels = ['Ваша идея', 'Кого ищем', 'Взаимная польза', 'Первый контакт'];
  const starts = [0, 3500, 7000, 11000];
  const duration = 15000;
  let step = 2;
  let elapsed = 0;
  let playing = false;
  let resumeAllowed = false;
  let interacted = false;
  let hasPlayed = false;
  let frame = 0;
  let previousTime = 0;

  function paint(announce = false) {
    root.dataset.step = String(step);
    root.dataset.playing = String(playing);
    panels.forEach((panel, index) => {
      const active = index === step;
      panel.classList.toggle('is-active', active);
      panel.inert = !active;
      panel.setAttribute('aria-hidden', String(!active));
    });
    steps.forEach((button, index) => {
      if (index === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.classList.toggle('is-done', index < step);
    });
    const label = playing ? 'Пауза' : resumeAllowed ? 'Продолжить демо' : elapsed >= duration ? 'Повторить демо' : 'Смотреть демо';
    playButton.innerHTML = '<i data-lucide="' + (playing ? 'pause' : 'play') + '" aria-hidden="true"></i><span>' + label + '</span>';
    if (window.lucide) window.lucide.createIcons();
    if (!playing) typingText.textContent = fullQuery;
    progress.style.width = (playing || resumeAllowed ? elapsed / duration * 100 : (step + 1) * 25) + '%';
    if (announce) announcement.textContent = 'Шаг ' + (step + 1) + '. ' + labels[step];
  }

  function stop(canResume = false) {
    playing = false;
    resumeAllowed = canResume && elapsed < duration;
    cancelAnimationFrame(frame);
    frame = 0;
    paint();
  }

  function tick(time) {
    if (!playing) return;
    elapsed += Math.min(time - previousTime, 100);
    previousTime = time;
    const nextStep = elapsed < starts[1] ? 0 : elapsed < starts[2] ? 1 : elapsed < starts[3] ? 2 : 3;
    if (nextStep !== step) {
      // Keep keyboard focus out of panels that are about to become inactive.
      if (panels[step].contains(document.activeElement)) playButton.focus({ preventScroll: true });
      step = nextStep;
      paint(true);
    }
    if (step === 0 && !reducedMotion.matches) {
      const count = Math.max(0, Math.min(fullQuery.length, Math.floor((elapsed - 300) / 42)));
      const text = fullQuery.slice(0, count);
      if (typingText.textContent !== text) typingText.textContent = text;
    }
    progress.style.width = Math.min(100, elapsed / duration * 100) + '%';
    if (elapsed >= duration) {
      elapsed = duration;
      stop();
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  function start(reset = true) {
    cancelAnimationFrame(frame);
    if (reset || elapsed >= duration) { elapsed = 0; step = 0; }
    playing = true;
    resumeAllowed = false;
    hasPlayed = true;
    previousTime = performance.now();
    paint(true);
    if (step === 0 && !reducedMotion.matches && elapsed === 0) typingText.textContent = '';
    frame = requestAnimationFrame(tick);
  }

  function selectStep(value, fromPhone = false) {
    interacted = true;
    stop();
    step = value;
    elapsed = starts[step];
    paint(true);
    if (fromPhone) steps[step].focus({ preventScroll: true });
  }

  steps.forEach(button => button.addEventListener('click', () => selectStep(Number(button.dataset.stepButton))));
  root.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => selectStep(Number(button.dataset.next), true)));
  root.querySelector('[data-replay]').addEventListener('click', () => {
    interacted = true;
    playButton.focus({ preventScroll: true });
    start();
  });
  playButton.addEventListener('click', () => {
    interacted = true;
    if (playing) stop(true);
    else start(!resumeAllowed);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) stop(true);
  });
  reducedMotion.addEventListener('change', () => { if (playing) stop(true); });

  paint();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting && playing) stop(true);
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25 && !hasPlayed && !interacted && !reducedMotion.matches && !document.hidden) start();
      }
    }, { threshold: [0, 0.25] });
    observer.observe(root);
  }
})();
