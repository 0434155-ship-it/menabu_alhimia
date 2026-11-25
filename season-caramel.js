// A shallow relief map gives the photographed sugar a moving refractive edge.
(() => {
 const stages=[...document.querySelectorAll('.sugar-stage')];
 const pour=document.querySelector('[data-sugar-pour]');
 const image=new Image(); image.decoding='async';
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
 if(!gl)return;
 const vs='attribute vec2 pos;varying vec2 uv;void main(){uv=pos*.5+.5;gl_Position=vec4(pos,0.,1.);}';
 const fs=`precision highp float;
 varying vec2 uv;uniform sampler2D photo;uniform vec2 scale,origin;uniform float time;
 float sugar(vec3 c){return smoothstep(.05,.24,c.g-c.b)*smoothstep(.16,.46,c.r)*smoothstep(.06,.25,c.r-c.b);}
 void main(){
   vec2 p=vec2(uv.x,1.-uv.y)*scale+origin;
   vec3 raw=texture2D(photo,p).rgb;
   float amber=sugar(raw)*smoothstep(.20,.47,p.y);
   float flow=sin(p.y*14.-time*1.65);
   vec2 bend=amber*vec2(.00195*sin(p.y*7.-time*.85),.0032*flow);
   vec3 c=texture2D(photo,p+bend).rgb;
   float edge=sugar(texture2D(photo,p+vec2(.0028,0.)).rgb)-sugar(texture2D(photo,p-vec2(.0028,0.)).rgb);
   float gleam=pow(.5+.5*cos(p.y*16.-time*2.0),5.);
   c+=vec3(.13,.091,.043)*abs(edge)*gleam+vec3(.045,.027,.008)*amber*gleam;
   // A travelling bead follows the fine strand. Refract the actual background through its curved surface.
   float cycle=fract(time*.139+.19);
   vec2 center=vec2(.5185+.002*(1.-cycle),.60+.46*cycle*cycle);
   vec2 q=(p-center)/vec2(.004+.003*cycle,.013+.008*cycle);
   float dome=dot(q,q);
   if(dome<1.) {
      vec3 normal=vec3(q,sqrt(max(0.,1.-dome)));
      vec3 through=texture2D(photo,p-.008*normal.xy).rgb;
      float shine=pow(max(0.,dot(normal,normalize(vec3(-.48,-.45,.76)))),18.);
      vec3 bead=mix(through,vec3(.86,.37,.055),.46)+vec3(1.,.92,.66)*shine;
      c=mix(c,bead,(1.-smoothstep(.80,1.,dome))*smoothstep(0.,.16,cycle));
   }
   gl_FragColor=vec4(c,1.);
 }`;
 function compile(kind,src){const sh=gl.createShader(kind);gl.shaderSource(sh,src);gl.compileShader(sh);return sh;}
 const prog=gl.createProgram();gl.attachShader(prog,compile(gl.VERTEX_SHADER,vs));gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);
 if(!gl.getProgramParameter(prog,gl.LINK_STATUS))return;
 gl.useProgram(prog);gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const a=gl.getAttribLocation(prog,'pos');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
 for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
 for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.LINEAR);
 const time=gl.getUniformLocation(prog,'time'),scale=gl.getUniformLocation(prog,'scale'),origin=gl.getUniformLocation(prog,'origin');
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');
 let stage,frame=0,prev=-100,ready=false,elapsed=0;
 function draw(ms){
   frame=0;if(!stage||!ready||document.hidden)return;
   const rect=canvas.getBoundingClientRect();if(rect.bottom<=0||rect.top>=innerHeight||!rect.width)return;
   if(ms-prev>=40||reduce.matches){
     elapsed+=reduce.matches?0:Math.min(.09,(ms-prev)/1000);prev=ms;
     const ratio=Math.min(devicePixelRatio||1,1.5,1400/rect.width);
     const w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));
     if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
     const zoom=Math.max(w/image.width,h/image.height),sx=w/(image.width*zoom),sy=h/(image.height*zoom);
     gl.viewport(0,0,w,h);gl.uniform2f(scale,sx,sy);gl.uniform2f(origin,(1.-sx)*.69,(1.-sy)*.45);
     gl.uniform1f(time,reduce.matches?0:elapsed+Math.max(0,-rect.top)*.003);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
   }
   if(!reduce.matches)frame=requestAnimationFrame(draw);
 }
 function refresh(){cancelAnimationFrame(frame);prev=-100;frame=requestAnimationFrame(draw);}
 function route(){
   const section=location.hash.slice(1)||document.body.dataset.view;
   stage=pour && !pour.closest('.hp-page').hidden ? pour : stages.find(s=>s.closest('.season')?.id===section);
   if(stage&&ready)stage.prepend(canvas);else canvas.remove();
   refresh();
 }
 image.onload=()=>{
   try {gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);ready=true;}
   catch {ready=false;}
   route();
 };
 image.crossOrigin='anonymous';
 image.src=pour?.querySelector('img')?.getAttribute('src') || (typeof mnbMedia==='function'?mnbMedia('muka/sugar-pull.webp'):'muka/sugar-pull.webp');
 if(pour)new MutationObserver(route).observe(pour.closest('.hp-page'),{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('bakeryroute',route);
 window.addEventListener('hashchange',route);window.addEventListener('resize',refresh);
 window.addEventListener('scroll',refresh,{passive:true});document.addEventListener('visibilitychange',refresh);reduce.addEventListener('change',refresh);
 canvas.addEventListener('webglcontextlost',()=>{ready=false;canvas.remove();});route();
})();
