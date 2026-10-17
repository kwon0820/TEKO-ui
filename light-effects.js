(() => {
  'use strict';
  function progress(seconds){return Math.max(0,Math.min(1,(seconds-2.3)/.8));}
  window.TekoLightEffects={progress,create({whites=[],clip,marker,line,fill,graph={}}) {
    const points=graph.points||window.TekoLightGraphPoints;
    const left=graph.left??112,right=graph.right??958,bottom=graph.bottom??662;
    const d=points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' ');
    line.setAttribute('d',d);fill?.setAttribute('d',`${d} L${right} ${bottom} L${left} ${bottom} Z`);
    let active=false,frame=0,last=0,elapsed=0;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    function paint() {
      whites.forEach((node,i)=>node.setAttribute('transform',`translate(0 ${reduced?0:Math.sin(elapsed*Math.PI*2/[2.9,2.35][i])*[28.77,17.98][i]})`));
      const p=progress(elapsed),x=left+p*(right-left);
      let lo=0,hi=points.length-1;
      while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid][0]<=x)lo=mid;else hi=mid;}
      const i=Math.min(points.length-2,lo);
      const a=points[i],b=points[i+1],blend=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));
      clip.setAttribute('width',String(p*(right-left)));
      marker.setAttribute('cx',String(x));marker.setAttribute('cy',String(a[1]+(b[1]-a[1])*blend));marker.setAttribute('opacity',p>0?'1':'0');
    }
    function tick(now){frame=0;if(!active)return;if(last)elapsed+=Math.min(.1,(now-last)/1000);last=now;paint();if((!reduced&&whites.length)||elapsed<3.1)frame=requestAnimationFrame(tick);}
    function stop(reset=false){active=false;cancelAnimationFrame(frame);frame=0;last=0;if(reset){elapsed=0;paint();}}
    paint();
    return {start(reset=false){if(reset){elapsed=0;paint();}if(active)return;active=true;last=0;frame=requestAnimationFrame(tick);},stop};
  }};
})();
