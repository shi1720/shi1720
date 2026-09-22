// A small, dependency-free WebGL point renderer. Geometry is expressive, not telemetry.
export const PARTICLE_COUNT = 48000;
const TAU = Math.PI * 2;
const vertex = `
precision highp float;
attribute vec4 seed;
uniform float time, yaw, pitch, aspect, density, activeTheme;
uniform vec3 forms;
varying vec3 color;
varying float opacity;
const float TAU = 6.28318530718;
vec3 geometry(float u, float v, float g) {
  float t=u*TAU, p=v*TAU;
  float radius=1.4+.38*cos(3.*t);
  float tube=.17+.18*pow(.5+.5*sin(3.*t),2.);
  vec3 orbit=vec3((radius+tube*cos(p))*cos(2.*t),(radius+tube*cos(p))*sin(2.*t),.65*sin(3.*t)+tube*sin(p));
  float lane=(g-2.)*.25;
  vec3 weave=vec3((u-.5)*3.7, .72*sin(t*1.5+lane*2.)+(v-.5)*.38, .8*cos(t*1.5+lane*2.)+lane);
  float latitude=(v-.5)*3.14159265359;
  float petal=1.18+.44*sin(t*5.+latitude*3.);
  vec3 bloom=vec3(petal*cos(latitude)*cos(t),petal*sin(latitude),petal*cos(latitude)*sin(t));
  return orbit*forms.x+weave*forms.y+bloom*forms.z;
}
void main(){
  float u=fract(seed.x+time*.006);
  vec3 p=geometry(u,seed.y,seed.z);
  float sway=sin(seed.x*70.+time*.5)*.008;
  p+=normalize(p+vec3(.001))*sway;
  p=vec3(p.x*cos(yaw)-p.z*sin(yaw),p.y,p.x*sin(yaw)+p.z*cos(yaw));
  p=vec3(p.x,p.y*cos(pitch)-p.z*sin(pitch),p.y*sin(pitch)+p.z*cos(pitch));
  float depth=5.-p.z;
  gl_Position=vec4(p.x*2.3/aspect,p.y*2.3,0.,depth);
  gl_PointSize=clamp((1.7+seed.w*1.4)*density*4.5/depth,1.,7.);
  vec3 mint=vec3(.56,.90,.77), amber=vec3(.97,.62,.36), lilac=vec3(.70,.62,.94), blue=vec3(.47,.73,.93), ivory=vec3(.92,.89,.76);
  color=seed.z<.5?mint:seed.z<1.5?amber:seed.z<2.5?lilac:seed.z<3.5?blue:ivory;
  color=mix(color,vec3(.95,.99,.94),pow(seed.w,7.)*.5);
  opacity=(.4+seed.w*.65)*(.55+.45*smoothstep(-1.6,1.6,p.z));
  if(activeTheme>=0. && abs(activeTheme-seed.z)>.1) opacity*=.13;
}`;
const fragment = `
precision mediump float;
varying vec3 color;
varying float opacity;
void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(color,opacity*(1.-smoothstep(.12,1.,d)));}
`;

export function shape(u, v, group, forms) {
  const t = u * TAU,
    p = v * TAU;
  const radius = 1.4 + 0.38 * Math.cos(3 * t);
  const tube = 0.17 + 0.18 * (0.5 + 0.5 * Math.sin(3 * t)) ** 2;
  const orbit = [
    (radius + tube * Math.cos(p)) * Math.cos(2 * t),
    (radius + tube * Math.cos(p)) * Math.sin(2 * t),
    0.65 * Math.sin(3 * t) + tube * Math.sin(p),
  ];
  const lane = (group - 2) * 0.25;
  const weave = [
    (u - 0.5) * 3.7,
    0.72 * Math.sin(t * 1.5 + lane * 2) + (v - 0.5) * 0.38,
    0.8 * Math.cos(t * 1.5 + lane * 2) + lane,
  ];
  const latitude = (v - 0.5) * Math.PI,
    petal = 1.18 + 0.44 * Math.sin(t * 5 + latitude * 3);
  const bloom = [
    petal * Math.cos(latitude) * Math.cos(t),
    petal * Math.sin(latitude),
    petal * Math.cos(latitude) * Math.sin(t),
  ];
  return orbit.map(
    (a, i) => a * forms[0] + weave[i] * forms[1] + bloom[i] * forms[2],
  );
}

export function project(position, yaw, pitch, width, height) {
  const [x, y, z] = position;
  const rx = x * Math.cos(yaw) - z * Math.sin(yaw),
    rz = x * Math.sin(yaw) + z * Math.cos(yaw);
  const ry = y * Math.cos(pitch) - rz * Math.sin(pitch),
    depth = y * Math.sin(pitch) + rz * Math.cos(pitch);
  const scale = (height * 1.15) / (5 - depth);
  return { x: width / 2 + rx * scale, y: height / 2 - ry * scale, depth };
}

export function createEngine(
  canvas,
  { onFrame, onUnavailable, reducedMotion = false },
) {
  let gl;
  try {
    gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: true,
      powerPreference: "low-power",
    });
  } catch {
    /* directory remains usable */
  }
  if (!gl) {
    onUnavailable();
    return null;
  }
  let program, uniforms;
  function initialize() {
    const compile = (kind, source) => {
      const shader = gl.createShader(kind);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    program = gl.createProgram();
    const shaders = [
      compile(gl.VERTEX_SHADER, vertex),
      compile(gl.FRAGMENT_SHADER, fragment),
    ];
    shaders.forEach((s) => gl.attachShader(program, s));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program));
    shaders.forEach((s) => gl.deleteShader(s));
    gl.useProgram(program);
    uniforms = Object.fromEntries(
      ["time", "yaw", "pitch", "aspect", "density", "forms", "activeTheme"].map(
        (n) => [n, gl.getUniformLocation(program, n)],
      ),
    );
    const seeds = new Float32Array(PARTICLE_COUNT * 4);
    let random = 1720;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      random = (Math.imul(1664525, random) + 1013904223) >>> 0;
      seeds[i * 4] = i / PARTICLE_COUNT;
      seeds[i * 4 + 1] = ((i % 64) + (random / 4294967296) * 0.28) / 64;
      seeds[i * 4 + 2] = Math.floor((i / PARTICLE_COUNT) * 5);
      seeds[i * 4 + 3] = random / 4294967296;
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, "seed");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 0, 0);
    gl.clearColor(9 / 255, 12 / 255, 16 / 255, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  }
  try {
    initialize();
  } catch {
    onUnavailable();
    return null;
  }
  let paused = reducedMotion,
    yaw = 0.3,
    pitch = -0.35,
    phase = 0,
    previous = 0,
    dirty = true,
    lost = false;
  let forms = [1, 0, 0],
    target = [1, 0, 0],
    theme = -1,
    drag = null;
  let width = 1,
    height = 1,
    dpr = 1;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    width = r.width;
    height = r.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    dirty = true;
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    onUnavailable();
  });
  canvas.addEventListener("webglcontextrestored", () => {
    try {
      initialize();
      resize();
      lost = false;
      dirty = true;
      document.querySelector("#fallback").hidden = true;
    } catch {
      onUnavailable();
    }
  });
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, yaw, pitch, id: e.pointerId };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    yaw = drag.yaw + (e.clientX - drag.x) * 0.006;
    pitch = Math.max(
      -1.2,
      Math.min(1.2, drag.pitch + (e.clientY - drag.y) * 0.006),
    );
    dirty = true;
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(event, () => {
      drag = null;
    });
  function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform1f(uniforms.time, phase);
    gl.uniform1f(uniforms.yaw, yaw);
    gl.uniform1f(uniforms.pitch, pitch);
    gl.uniform1f(uniforms.aspect, width / height);
    gl.uniform1f(uniforms.density, dpr);
    gl.uniform1f(uniforms.activeTheme, theme);
    gl.uniform3fv(uniforms.forms, forms);
    gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
    canvas.dataset.rendered = "true";
    onFrame({ yaw, pitch, width, height, forms, phase });
  }
  function tick(now) {
    // Bound continuous drawing on high-refresh displays and software renderers.
    if (now - previous < 1000 / 30) {
      requestAnimationFrame(tick);
      return;
    }
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (!lost && !document.hidden) {
      if (!paused && !drag) {
        yaw += dt * 0.055;
        phase += dt;
        dirty = true;
      }
      if (forms.some((v, i) => Math.abs(v - target[i]) > 0.001)) {
        forms = forms.map((v, i) =>
          reducedMotion
            ? target[i]
            : v + (target[i] - v) * Math.min(1, dt * 3.5),
        );
        dirty = true;
      }
      if (dirty) {
        draw();
        dirty = false;
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return {
    pause(value) {
      paused = value;
      dirty = true;
    },
    reduce(value) {
      reducedMotion = value;
      paused = value;
      forms = [...target];
      dirty = true;
    },
    form(index) {
      target = [0, 0, 0];
      target[index] = 1;
      if (paused || reducedMotion) forms = [...target];
      dirty = true;
    },
    filter(value) {
      theme = value;
      dirty = true;
    },
    reset() {
      yaw = 0.3;
      pitch = -0.35;
      phase = 0;
      dirty = true;
    },
    snapshot() {
      draw();
      return canvas.toDataURL("image/png");
    },
  };
}
