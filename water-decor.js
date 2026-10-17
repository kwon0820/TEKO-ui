/* One fixed ellipse; white spheres keep their horizontal anchors. */
(() => {
  'use strict';
  function sample(seconds,index=0) {
    const theta=seconds*Math.PI*2/22+(index===0?-.34:3.59),a=-26*Math.PI/180;
    const x=468*Math.cos(theta),y=88*Math.sin(theta);
    return {x:488+x*Math.cos(a)-y*Math.sin(a),y:740+x*Math.sin(a)+y*Math.cos(a),front:Math.sin(theta)>=0};
  }
  window.TekoWaterDecor={sample,create({beads,frontBeads=[],whites,arm}) {
    let frame=0,active=false,elapsed=0,last=0;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    function paint(t) {
      beads.forEach((node,index)=>{const p=sample(t,index),front=frontBeads[index];
        for(const target of [node,front])if(target){target.setAttribute('x',String(p.x-(index?19:24)));target.setAttribute('y',String(p.y-(index?19:24)));}
        node.setAttribute('opacity',front&&p.front?'0':'1');
        front?.setAttribute('opacity',p.front?'1':'0');
      });
      whites.forEach((node,index)=>{const amplitude=[24,15,18][index],period=[2.9,2.35,3.2][index];node.setAttribute('transform',`translate(0 ${Math.sin(t*Math.PI*2/period)*amplitude})`);});
      arm?.setAttribute('transform',`rotate(${Math.sin(t*Math.PI*2/4.8)*16} 33 105)`);
    }
    function tick(now) {frame=0;if(!active)return;if(last)elapsed+=Math.min(.06,(now-last)/1000);last=now;paint(elapsed);frame=requestAnimationFrame(tick);}
    function stop(reset=false){active=false;cancelAnimationFrame(frame);frame=0;last=0;if(reset){elapsed=0;paint(0);}}
    paint(0);
    return {start(){if(active)return;active=true;last=0;if(!reduced)frame=requestAnimationFrame(tick);},stop};
  }};
})();
