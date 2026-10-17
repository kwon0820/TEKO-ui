/* Browser-local playback of an H.264 video carrying colour + an alpha mask.
   The offline matte preserves enclosed black details (eyes and mouth).
   A transparent animated WebP covers file:// canvas restrictions and codecs. */
(() => {
  'use strict';
  window.TekoMotion = {
    create({ container, video, canvas, fallback }) {
      const context = canvas.getContext('2d');
      const scratch = document.createElement('canvas');
      const scratchContext = scratch.getContext('2d', { willReadFrequently: true });
      let output;
      let active = false;
      let useFallback = false;
      let animationId = 0;
      let lastTime = -1;

      function fallbackPlayback() {
        useFallback = true;
        video.pause();
        cancelAnimationFrame(animationId);
        if (!active) return;
        fallback.src = fallback.dataset.motionSrc;
        fallback.hidden = false;
        container.classList.remove('is-playing');
        container.classList.add('is-fallback');
      }

      function render() {
        if (!active || useFallback) return;
        if (video.readyState >= 2 && video.currentTime !== lastTime) {
          try {
            const width = video.videoWidth / 2;
            const height = video.videoHeight;
            if (!output || canvas.width !== width || canvas.height !== height) {
              canvas.width = width; canvas.height = height;
              scratch.width = width * 2; scratch.height = height;
              output = context.createImageData(width, height);
            }
            scratchContext.drawImage(video, 0, 0);
            const packed = scratchContext.getImageData(0, 0, width * 2, height).data;
            const pixels = output.data;
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const source = (y * width * 2 + x) * 4;
                const target = (y * width + x) * 4;
                pixels[target] = packed[source];
                pixels[target + 1] = packed[source + 1];
                pixels[target + 2] = packed[source + 2];
                pixels[target + 3] = packed[source + width * 4];
              }
            }
            context.putImageData(output, 0, 0);
            lastTime = video.currentTime;
            container.classList.add('is-playing');
          } catch (_) {
            fallbackPlayback();
            return;
          }
        }
        animationId = requestAnimationFrame(render);
      }

      function start(restart = false) {
        active = true;
        video.muted = true;
        if (!context || !scratchContext || useFallback) {
          fallbackPlayback();
          return;
        }
        if (restart) {
          video.currentTime = 0;
          lastTime = -1;
        }
        cancelAnimationFrame(animationId);
        // Called directly by the splash tap so mobile playback has user activation.
        try {
          const playing = video.play();
          playing?.catch(() => { if (active) fallbackPlayback(); });
          render();
        } catch (_) { fallbackPlayback(); }
      }

      function stop(reset = false) {
        active = false;
        cancelAnimationFrame(animationId);
        video.pause();
        if (reset) {
          video.currentTime = 0;
          lastTime = -1;
          container.classList.remove('is-playing', 'is-fallback');
          fallback.hidden = true;
          fallback.removeAttribute('src');
        }
      }
      video.addEventListener('error', fallbackPlayback);
      return { start, stop };
    },
  };
})();
