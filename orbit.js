/* Fixed centre; separate near/far SVG planes occlude correctly around Bobo. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  function sample(seconds, index = 0) {
    const theta = seconds * TAU / 18 + index * TAU / 3 + .22;
    const depth = Math.sin(theta);
    const rotation = -27 + seconds * 360 / 120;
    return { x: 440 * Math.cos(theta), y: 105 * depth,
      scale: .46 + (depth + 1) * .40,
      opacity: .55 + (depth + 1) * .225, front: depth >= 0, rotation };
  }
  window.TekoOrbit = { sample, create({ back, front }) {
    const ns = 'http://www.w3.org/2000/svg';
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    function plane(svg, near) {
      const suffix = near ? 'front' : 'back';
      svg.innerHTML = `<defs><radialGradient id="bead-${suffix}" cx="30%" cy="24%" r="78%"><stop offset="0" stop-color="#ffffff"/><stop offset=".28" stop-color="#b5ffec"/><stop offset=".67" stop-color="#00d5ad"/><stop offset="1" stop-color="#00a98d"/></radialGradient></defs>`;
      const group = document.createElementNS(ns, 'g');
      const path = document.createElementNS(ns, 'path');
      const points = Array.from({ length: 65 }, (_, i) => {
        const theta = (near ? 0 : Math.PI) + i / 64 * Math.PI;
        return `${i ? 'L' : 'M'}${(440*Math.cos(theta)).toFixed(2)} ${(105*Math.sin(theta)).toFixed(2)}`;
      });
      path.setAttribute('d', points.join(' '));
      path.setAttribute('fill','none');
      path.setAttribute('stroke','#aeb7b4');
      path.setAttribute('stroke-width','1.3');
      path.setAttribute('stroke-dasharray','4 4');
      path.setAttribute('stroke-linecap','round');
      group.append(path);
      const beads = [22,16,13].map(radius => {
        const bead = document.createElementNS(ns,'circle');
        bead.setAttribute('r',radius);
        bead.setAttribute('fill',`url(#bead-${suffix})`);
        bead.setAttribute('stroke','#d4fff2');
        bead.setAttribute('stroke-width','2');
        group.append(bead);
        return bead;
      });
      svg.append(group);
      return { group, path, beads, near };
    }
    const planes = [plane(back,false),plane(front,true)];
    let frame = 0, timer = 0, active = false, elapsed = 0, previous = null;
    function draw(seconds) {
      for (const layer of planes) {
        layer.group.setAttribute('transform',`translate(418 664) rotate(${sample(seconds).rotation})`);
        layer.path.setAttribute('stroke-dashoffset', -seconds * 8);
        layer.beads.forEach((bead,index) => {
          const state = sample(seconds,index);
          bead.style.display = state.front === layer.near ? '' : 'none';
          bead.setAttribute('transform',`translate(${state.x} ${state.y}) scale(${state.scale})`);
          bead.setAttribute('opacity', state.opacity);
        });
      }
    }
    function tick(now) {
      if (!active) return;
      if (previous !== null) elapsed += Math.min((now-previous)/1000,.05);
      previous = now;
      draw(elapsed);
      frame = requestAnimationFrame(tick);
    }
    function stop(reset = false) {
      active = false;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      previous = null;
      if (reset) { elapsed = 0; draw(0); }
    }
    function start(delay = 0) {
      if (active) return;
      clearTimeout(timer);
      if (reduced) { draw(0); return; }
      timer = setTimeout(() => {
        active = true; previous = null;
        frame = requestAnimationFrame(tick);
      }, delay);
    }
    draw(0);
    return { start, stop };
  } };
})();
