/* Unit sphere, fixed centre, quaternion rotation; shares the number's input math. */
(() => {
  'use strict';
  function surfacePoint(x,y) {
    const radius=x*x+y*y;
    return radius<=1?[x,y,Math.sqrt(Math.max(0,1-radius))]:null;
  }
  window.TekoSun3D={surfacePoint,create({stage,canvas,texture,relief}){
    const {rotate,matrix}=window.TekoNumber3D;
    const allowAuto=!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let q=[0,0,0,1],active=false,drag=null,vx=0,vy=0,frame=0,lastFrame=0,draw,autoRotate=allowAuto;
    try {
      const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
      if(!gl)throw new Error('WebGL unavailable');
      const vs=`attribute vec3 aPosition;attribute vec2 aUV;uniform mat3 uRotation;
        varying vec3 vNormal;varying vec3 vLocal;varying vec2 vUV;
        void main(){vec3 p=uRotation*aPosition;gl_Position=vec4(p.xy*.985,-p.z*.8,1.);vNormal=p;vLocal=aPosition;vUV=aUV;}`;
      const fs=`precision mediump float;varying vec3 vNormal;varying vec3 vLocal;varying vec2 vUV;
        uniform sampler2D uSurface;uniform sampler2D uRelief;uniform float uTextured;uniform float uReliefReady;uniform mat3 uRotation;
        void main(){vec3 n=normalize(vNormal);
          if(uReliefReady>.5){vec2 slope=(texture2D(uRelief,vUV).rg*2.-1.)*1.15;float lon=(vUV.x-.5)*6.2831853;
            vec3 local=normalize(vLocal);vec3 tu=vec3(cos(lon),0.,-sin(lon));vec3 tv=normalize(cross(local,tu));
            n=normalize(uRotation*normalize(local-tu*slope.x-tv*slope.y));}
          vec3 light=normalize(vec3(-.4,.7,1.));float diffuse=max(dot(n,light),0.);
          float grain=fract(sin(dot(vUV*vec2(1024.,512.),vec2(12.9898,78.233)))*43758.5453);
          vec3 color=vec3(1.,.23,.3)*(.89+.11*grain);
          if(uTextured>.5)color=texture2D(uSurface,vUV).rgb;
          else if(vLocal.z>0.){float spot=min(length((vLocal.xy-vec2(-.28,-.06))*vec2(1.,4.)),min(length((vLocal.xy-vec2(.13,.09))*vec2(1.,4.)),length((vLocal.xy-vec2(.47,-.04))*vec2(1.,4.))));color=mix(vec3(.12),color,smoothstep(.022,.04,spot));}
          float shine=pow(max(dot(n,normalize(light+vec3(0.,0.,1.))),0.),26.)*.055;
          float material=smoothstep(.25,.65,max(color.r,max(color.g,color.b)));
          gl_FragColor=vec4(color*(.58+.42*diffuse)+vec3(shine*material),1.);}`;
      function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Sphere shader failed');return s;}
      const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Sphere program failed');gl.useProgram(program);
      const positions=[],uv=[];
      function vertex(row,col){const theta=row/64*Math.PI,lon=col/128*2*Math.PI-Math.PI;positions.push(Math.sin(theta)*Math.sin(lon),Math.cos(theta),Math.sin(theta)*Math.cos(lon));uv.push(col/128,1-row/64);}
      for(let row=0;row<64;row++)for(let col=0;col<128;col++){
        vertex(row,col);vertex(row+1,col);vertex(row+1,col+1);vertex(row,col);vertex(row+1,col+1);vertex(row,col+1);
      }
      function attribute(name,values,size){gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);}
      attribute('aPosition',positions,3);attribute('aUV',uv,2);
      const rotation=gl.getUniformLocation(program,'uRotation'),textured=gl.getUniformLocation(program,'uTextured');gl.uniform1f(textured,0);
      const surfaceTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,surfaceTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,74,87,255]));
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      function load(){try{gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,surfaceTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,texture);gl.uniform1f(textured,1);if(active)draw();}catch(_){/* Procedural spherical surface remains available. */}}
      texture.addEventListener('load',load);if(texture.complete&&texture.naturalWidth)load();
      const reliefReady=gl.getUniformLocation(program,'uReliefReady'),reliefTexture=gl.createTexture();
      gl.uniform1i(gl.getUniformLocation(program,'uRelief'),1);gl.uniform1f(reliefReady,0);
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,reliefTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([128,128,128]));
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      function loadRelief(){try{gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,reliefTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,relief);gl.uniform1f(reliefReady,1);if(active)draw();}catch(_){/* Colour and shape remain available if relief cannot load. */}}
      if(relief){relief.addEventListener('load',loadRelief);if(relief.complete&&relief.naturalWidth)loadRelief();}
      gl.activeTexture(gl.TEXTURE0);
      gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
      draw=()=>{gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix3fv(rotation,false,new Float32Array(matrix(q)));gl.drawArrays(gl.TRIANGLES,0,positions.length/3);stage.classList.add('is-sun-ready');};
    }catch(_){
      // Analytic ray/sphere rendering preserves true 3D rotation without WebGL.
      let ctx=canvas.getContext('2d');
      if(!ctx){const replacement=document.createElement('canvas');replacement.className=canvas.className;canvas.replaceWith(replacement);canvas=replacement;ctx=canvas.getContext('2d');}
      canvas.width=canvas.height=256;const output=ctx.createImageData(256,256);
      let source=null,reliefSource=null,tw=0,th=0;
      function load(){try{const scratch=document.createElement('canvas');tw=scratch.width=texture.naturalWidth;th=scratch.height=texture.naturalHeight;const sc=scratch.getContext('2d',{willReadFrequently:true});sc.drawImage(texture,0,0);source=sc.getImageData(0,0,tw,th).data;if(active)draw();}catch(_){source=null;}}
      texture.addEventListener('load',load);if(texture.complete&&texture.naturalWidth)load();
      function loadRelief(){try{const scratch=document.createElement('canvas');scratch.width=relief.naturalWidth;scratch.height=relief.naturalHeight;const sc=scratch.getContext('2d',{willReadFrequently:true});sc.drawImage(relief,0,0);reliefSource=sc.getImageData(0,0,scratch.width,scratch.height).data;if(active)draw();}catch(_){reliefSource=null;}}
      if(relief){relief.addEventListener('load',loadRelief);if(relief.complete&&relief.naturalWidth)loadRelief();}
      draw=()=>{
        const m=matrix(q),pixels=output.data;
        for(let y=0;y<256;y++)for(let x=0;x<256;x++){
          const nx=(x+ .5-128)/126,ny=(128-y-.5)/126,point=surfacePoint(nx,ny),i=(y*256+x)*4;
          if(!point){pixels[i+3]=0;continue;}
          const nz=point[2],ox=m[0]*nx+m[1]*ny+m[2]*nz,oy=m[3]*nx+m[4]*ny+m[5]*nz,oz=m[6]*nx+m[7]*ny+m[8]*nz;
          let wx=nx,wy=ny,wz=nz;
          const lon=Math.atan2(ox,oz),u=(lon+Math.PI)/(Math.PI*2),v=(Math.PI/2-Math.asin(Math.max(-1,Math.min(1,oy))))/Math.PI,j=(Math.min(th-1,Math.floor(v*th))*tw+Math.min(tw-1,Math.floor(u*tw)))*4;
          if(reliefSource){const bu=(reliefSource[j]/255*2-1)*1.15,bv=(reliefSource[j+1]/255*2-1)*1.15,sl=Math.sin(lon),cl=Math.cos(lon),cp=Math.sqrt(Math.max(0,1-oy*oy));let ax=ox-cl*bu+oy*sl*bv,ay=oy-cp*bv,az=oz+sl*bu+oy*cl*bv;const length=Math.hypot(ax,ay,az);ax/=length;ay/=length;az/=length;wx=m[0]*ax+m[3]*ay+m[6]*az;wy=m[1]*ax+m[4]*ay+m[7]*az;wz=m[2]*ax+m[5]*ay+m[8]*az;}
          const light=.58+.42*Math.max(0,(-.4*wx+.7*wy+wz)/Math.sqrt(1.65));
          const hx=-.4/Math.sqrt(1.65),hy=.7/Math.sqrt(1.65),hz=1+1/Math.sqrt(1.65),shine=Math.pow(Math.max(0,(wx*hx+wy*hy+wz*hz)/Math.hypot(hx,hy,hz)),26)*.055*255;
          if(source){const material=source[j]>.65*255?1:0;pixels[i]=source[j]*light+shine*material;pixels[i+1]=source[j+1]*light+shine*material;pixels[i+2]=source[j+2]*light+shine*material;}
          else{let spot=oz>0&&Math.min(Math.hypot(ox+.28,(oy+.06)*4),Math.hypot(ox-.13,(oy-.09)*4),Math.hypot(ox-.47,(oy+.04)*4))<.035;pixels[i]=(spot?35:255)*light;pixels[i+1]=(spot?35:68)*light;pixels[i+2]=(spot?35:83)*light;}
          pixels[i+3]=Math.min(255,(1-nx*nx-ny*ny)*126*255);
        }
        ctx.putImageData(output,0,0);stage.classList.add('is-sun-ready');
      };
    }
    function tick(now){if(!active)return;const dt=lastFrame?Math.min((now-lastFrame)/16.667,2):1;lastFrame=now;if(!drag&&autoRotate){q=rotate(q,.00349*dt,0);draw();}else if(!drag&&Math.hypot(vx,vy)>.0001){q=rotate(q,vx*dt,vy*dt);vx*=Math.pow(.93,dt);vy*=Math.pow(.93,dt);draw();}if(autoRotate||Math.hypot(vx,vy)>.0001)frame=requestAnimationFrame(tick);else frame=0;}
    function animate(){if(!frame){lastFrame=0;frame=requestAnimationFrame(tick);}}
    function start(reset=false){if(reset){cancelAnimationFrame(frame);frame=0;drag=null;q=[0,0,0,1];vx=vy=0;autoRotate=allowAuto;stage.classList.remove('is-rotating');}active=true;draw();if(autoRotate||Math.hypot(vx,vy)>.0001)animate();}
    function stop(reset=false){active=false;drag=null;vx=vy=0;cancelAnimationFrame(frame);frame=0;stage.classList.remove('is-rotating');if(reset){q=[0,0,0,1];draw();}}
    stage.addEventListener('pointerdown',event=>{if(!active||!event.isPrimary||(event.button!==undefined&&event.button!==0))return;event.preventDefault();event.stopPropagation();autoRotate=false;drag={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};vx=vy=0;stage.setPointerCapture?.(event.pointerId);stage.classList.add('is-rotating');});
    stage.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;event.preventDefault();event.stopPropagation();const now=performance.now(),dt=Math.max(8,now-drag.time),factor=2*Math.PI/(Math.max(140,stage.getBoundingClientRect().width)*1.65),dx=(event.clientX-drag.x)*factor,dy=(event.clientY-drag.y)*factor;q=rotate(q,dx,dy);vx=Math.max(-.11,Math.min(.11,.55*vx+.45*dx*16/dt));vy=Math.max(-.11,Math.min(.11,.55*vy+.45*dy*16/dt));drag={...drag,x:event.clientX,y:event.clientY,time:now};draw();});
    function release(event){if(!drag||drag.id!==event.pointerId)return;event.stopPropagation();if(performance.now()-drag.time>100)vx=vy=0;drag=null;stage.classList.remove('is-rotating');animate();}
    stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',event=>{vx=vy=0;release(event);});
    stage.addEventListener('keydown',event=>{if(!active)return;const moves={ArrowLeft:[-.26,0],ArrowRight:[.26,0],ArrowUp:[0,-.26],ArrowDown:[0,.26]};if(event.key==='Home'){q=[0,0,0,1];vx=vy=0;}else if(moves[event.key])q=rotate(q,...moves[event.key]);else return;autoRotate=false;event.preventDefault();event.stopPropagation();draw();});
    return{start,stop,get orientation(){return [...q];}};
  }};
})();
