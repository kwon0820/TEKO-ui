(() => {
  'use strict';
  function sample(t,i){return Math.sin(t*Math.PI*2/[2.9,2.35,3.2,2.7][i])*[21.73,13.58,16.3,16.3][i];}
  window.TekoTemperatureFloat={sample,create({nodes}){
    let active=false,frame=0,last=0,elapsed=0;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    function paint(){nodes.forEach((node,i)=>node.setAttribute('transform',`translate(0 ${sample(elapsed,i)})`));}
    function tick(now){frame=0;if(!active)return;if(last)elapsed+=Math.min(.06,(now-last)/1000);last=now;paint();frame=requestAnimationFrame(tick);}
    function stop(reset=false){active=false;cancelAnimationFrame(frame);frame=0;last=0;if(reset){elapsed=0;paint();}}
    paint();return{start(){if(active)return;active=true;last=0;if(!reduced)frame=requestAnimationFrame(tick);},stop};
  }};
})();
