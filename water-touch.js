/* Additive spring impulses: repeated taps build motion without restarting it. */
(() => {
  'use strict';
  function step(state, dt) {
    const count=Math.max(1,Math.ceil(dt*120)),h=dt/count;
    for(let i=0;i<count;i++) {
      state.sv+=(-210*state.s-7.5*state.sv)*h;
      state.s+=state.sv*h;
      state.bv+=(-135*state.b-6.8*state.bv)*h;
      state.b+=state.bv*h;
      if(Math.abs(state.s)>.16){state.s=Math.sign(state.s)*.16;state.sv*=-.25;}
      if(Math.abs(state.b)>.18){state.b=Math.sign(state.b)*.18;state.bv*=-.25;}
    }
    return Math.abs(state.s)+Math.abs(state.b)+Math.abs(state.sv)+Math.abs(state.bv);
  }
  window.TekoWaterTouch={step,create({stage,image,particles,ripple}) {
    const state={s:0,sv:0,b:0,bv:0},drops=[];
    let active=false,frame=0,last=0;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    function paint() {
      image.style.transform=`scale(${1+state.s},${1-state.s*.68}) skewX(${state.b*13}deg) rotate(${state.b*3}deg)`;
      ripple?.setAttribute('scale',String((state.s*23+state.b*9)*(reduced ? .3 : 1)));
    }
    function tick(now) {
      frame=0;if(!active)return;
      const dt=last?Math.min(.05,Math.max(0,(now-last)/1000)):1/60;last=now;
      const energy=step(state,dt);paint();
      for(let i=drops.length-1;i>=0;i--) {
        const p=drops[i];p.age+=dt;
        if(p.age>=p.life){p.node.remove();drops.splice(i,1);continue;}
        p.vx*=Math.exp(-.6*dt);p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
        const progress=p.age/p.life,fade=1-Math.max(0,(progress-.22)/.78);
        p.node.style.opacity=String(fade*fade*.9);
        p.node.style.transform=`translate3d(${p.x}px,${p.y}px,0) rotate(${p.angle+p.age*p.spin}deg) scale(${p.size*(1-progress*.65)})`;
      }
      if(energy>.001||drops.length)frame=requestAnimationFrame(tick);
      else {state.s=state.sv=state.b=state.bv=0;image.style.transform='none';ripple?.setAttribute('scale','0');last=0;}
    }
    function burst(width,height) {
      const density=reduced?4:9+Math.floor(Math.random()*5),unit=width/180;
      for(let i=0;i<density;i++) {
        if(drops.length>=72){drops.shift().node.remove();}
        const angle=Math.random()*Math.PI*2,cs=Math.cos(angle),sn=Math.sin(angle);
        const node=document.createElement('span');node.className='water-splash-drop';particles.appendChild(node);
        const speed=(35+Math.random()*85)*unit;
        const p={node,x:width*.5+cs*width*(sn<-.3?.25:.43),y:height*.56+sn*height*.35,
          vx:cs*speed+(Math.random()-.5)*30*unit,vy:sn*speed-25*unit,
          gravity:(65+Math.random()*80)*unit,age:0,life:.55+Math.random()*.65,
          size:(.24+Math.random()*.52)*unit,angle:Math.random()*360,spin:(Math.random()-.5)*220};
        node.style.opacity='0';drops.push(p);
      }
    }
    function tap(event) {
      if(!active)return;
      event.stopPropagation();
      const bounds=stage.getBoundingClientRect();
      const side=Number.isFinite(event.clientX)&&event.detail!==0?Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1)):(Math.random()-.5);
      const strength=reduced ? .5 : 1;
      state.sv=Math.min(4.2,state.sv+(2.1+Math.random()*.45)*strength);
      state.bv=Math.max(-3,Math.min(3,state.bv+(side*1.5+(Math.random()-.5)*.7)*strength));
      burst(bounds.width,bounds.height);
      if(!frame){last=0;frame=requestAnimationFrame(tick);}
    }
    stage.addEventListener('click',tap);
    // Preserve the detail page's edge swipe: the drop only owns taps.
    function stop(){active=false;cancelAnimationFrame(frame);frame=0;last=0;state.s=state.sv=state.b=state.bv=0;image.style.transform='none';ripple?.setAttribute('scale','0');for(const p of drops)p.node.remove();drops.length=0;}
    return {start(){active=true;},stop,get state(){return {...state};},get particleCount(){return drops.length;}};
  }};
})();
