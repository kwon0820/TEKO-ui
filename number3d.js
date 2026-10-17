/* Actual closed, bevelled 3D geometry traced from the supplied black 25. */
(() => {
  'use strict';
  function multiply(a,b) {
    return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
      a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
      a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
      a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
  }
  function rotate(q,dx,dy) {
    const yaw=[0,Math.sin(dx/2),0,Math.cos(dx/2)];
    const pitch=[Math.sin(dy/2),0,0,Math.cos(dy/2)];
    const result=multiply(multiply(pitch,yaw),q),length=Math.hypot(...result);
    return result.map(v=>v/length);
  }
  function matrix([x,y,z,w]) {
    return [1-2*(y*y+z*z),2*(x*y+z*w),2*(x*z-y*w),
      2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w),
      2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y)];
  }
  window.TekoNumber3D={rotate,matrix,create({stage,canvas,poster,face,degree}) {
    const mesh=window.TekoNumberMesh;
    let q=[0,0,0,1], vx=0,vy=0,frame=0,active=false,drag=null,lastFrame=0;
    let draw, fallback;
    try {
      const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
      if(!gl || !mesh) throw new Error('WebGL unavailable');
      const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUV;attribute float aFace;
        uniform mat3 uRotation;uniform vec2 uOffset;varying vec3 vNormal;varying vec2 vUV;varying float vFace;
        void main(){vec3 p=uRotation*aPosition;float s=1100.0/(1100.0-p.z);
          gl_Position=vec4((p.xy*s+uOffset)/vec2(440.0,360.0),-p.z/1000.0,1.0);
          vNormal=uRotation*aNormal;vUV=aUV;vFace=aFace;}`;
      const fragment=`precision mediump float;varying vec3 vNormal;varying vec2 vUV;varying float vFace;
        uniform sampler2D uTexture;uniform float uTextured;
        void main(){vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-0.45,0.8,1.0));
          float diffuse=max(dot(n,light),0.0);float rim=pow(1.0-abs(n.z),3.0);
          float spec=pow(max(dot(n,normalize(light+vec3(0.,0.,1.))),0.),24.);
          vec3 base=vec3(0.045+0.12*diffuse+0.035*rim+0.065*spec);
          if(vFace>0.5 && uTextured>0.5){vec4 tex=texture2D(uTexture,vUV);base=mix(vec3(.07),tex.rgb,tex.a)*(0.72+0.4*diffuse)+vec3(0.015*spec);}
          gl_FragColor=vec4(base,1.0);}`;
      function shader(type,source) {
        const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
        if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error('Shader compilation failed');
        return s;
      }
      const program=gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Shader linking failed');
      gl.useProgram(program);
      function attribute(name,data,size) {
        gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
        const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);
      }
      attribute('aPosition',mesh.positions,3);attribute('aNormal',mesh.normals,3);
      attribute('aUV',mesh.uv,2);attribute('aFace',mesh.faces,1);
      const rotation=gl.getUniformLocation(program,'uRotation'),textured=gl.getUniformLocation(program,'uTextured');
      gl.uniform2f(gl.getUniformLocation(program,'uOffset'),mesh.center[0]-320,242.5-mesh.center[1]);
      gl.uniform1f(textured,0);
      gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([24,24,24,255]));
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      function loadTexture() {
        try {gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,face);gl.uniform1f(textured,1);if(active) draw();} catch(_){/* Geometry works even if file:// textures are restricted. */}
      }
      face.addEventListener('load',loadTexture);
      if(face.complete && face.naturalWidth) loadTexture();
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);
      draw=()=>{
        gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix3fv(rotation,false,new Float32Array(matrix(q)));
        gl.drawArrays(gl.TRIANGLES,0,mesh.faces.length);
        stage.classList.add('is-3d-ready');
      };
      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();stop();stage.classList.remove('is-3d-ready');});
    } catch(_) {
      // Layered transparent silhouettes retain depth when WebGL is disabled.
      fallback=document.createElement('div');fallback.className='number-css-solid';
      for(let i=0;i<25;i++) {
        const layer=document.createElement('img');layer.src=face.src;layer.alt='';
        layer.style.transform=`translateZ(${-30+i*2.5}px)`;layer.style.filter=i===24?'none':'brightness(.55)';
        fallback.append(layer);
      }
      stage.append(fallback);
      draw=()=>{fallback.style.transform=`matrix3d(${(()=>{const m=matrix(q);return [m[0],m[1],m[2],0,m[3],m[4],m[5],0,m[6],m[7],m[8],0,0,0,0,1].join(',');})()})`;stage.classList.add('is-css-3d');};
    }
    function tick(now) {
      if(!active) return;
      const dt=lastFrame?Math.min((now-lastFrame)/16.667,2):1;lastFrame=now;
      if(!drag && Math.hypot(vx,vy)>.0001){q=rotate(q,vx*dt,vy*dt);vx*=Math.pow(.93,dt);vy*=Math.pow(.93,dt);draw();}
      if(drag || Math.hypot(vx,vy)>.0001)frame=requestAnimationFrame(tick);else frame=0;
    }
    function animate(){if(!frame){lastFrame=0;frame=requestAnimationFrame(tick);}}
    function start(reset=false){if(reset){stop(true);lastFrame=0;stage.classList.remove('is-rotating');}active=true;draw();if(Math.hypot(vx,vy)>.0001)animate();}
    function stop(reset=false){active=false;drag=null;cancelAnimationFrame(frame);frame=0;vx=vy=0;if(reset){q=[0,0,0,1];draw();}}
    stage.addEventListener('pointerdown',event=>{
      if(!active || !event.isPrimary || (event.button!==undefined && event.button!==0))return;
      event.preventDefault();event.stopPropagation();
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};vx=vy=0;
      stage.setPointerCapture?.(event.pointerId);stage.classList.add('is-rotating');
    });
    stage.addEventListener('pointermove',event=>{
      if(!drag || drag.id!==event.pointerId)return;
      event.preventDefault();event.stopPropagation();
      const now=performance.now(),dt=Math.max(8,now-drag.time);
      const factor=2*Math.PI/(Math.max(140,stage.getBoundingClientRect().width)*1.65);
      const dx=(event.clientX-drag.x)*factor,dy=(event.clientY-drag.y)*factor;
      q=rotate(q,dx,dy);vx=Math.max(-.11,Math.min(.11,.55*vx+.45*dx*16/dt));vy=Math.max(-.11,Math.min(.11,.55*vy+.45*dy*16/dt));
      drag={...drag,x:event.clientX,y:event.clientY,time:now};draw();
    });
    function release(event){if(!drag || drag.id!==event.pointerId)return;event.stopPropagation();if(performance.now()-drag.time>100)vx=vy=0;drag=null;stage.classList.remove('is-rotating');animate();}
    stage.addEventListener('pointerup',release);
    stage.addEventListener('pointercancel',event=>{vx=vy=0;release(event);});
    stage.addEventListener('keydown',event=>{
      if(!active)return;
      const moves={ArrowLeft:[-.26,0],ArrowRight:[.26,0],ArrowUp:[0,-.26],ArrowDown:[0,.26]};
      if(event.key==='Home'){q=[0,0,0,1];vx=vy=0;}
      else if(moves[event.key])q=rotate(q,...moves[event.key]);else return;
      event.preventDefault();event.stopPropagation();draw();
    });
    return {start,stop,get orientation(){return [...q];}};
  }};
})();
