import React, { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec2, RenderTarget, Color } from 'ogl';

interface InterstellarProps extends React.HTMLAttributes<HTMLDivElement> {
  baseColor?: [number, number, number];
  glowColor?: [number, number, number];
  dissipation?: number;
  velocityDissipation?: number;
  interactive?: boolean;
}

export const InterstellarFluid: React.FC<InterstellarProps> = ({
  baseColor = [0.05, 0.05, 0.2],
  glowColor = [0.8, 0.4, 1.0],
  dissipation = 0.97,
  interactive = true,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: false,
        dpr: Math.min(window.devicePixelRatio, 2),
      });
    } catch (e) {
      console.warn('InterstellarFluid: WebGL not available', e);
      return;
    }
    const gl = renderer.gl;

    const simFragment = `
precision highp float;
uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform vec2 uResolution;
uniform float uAspect;
uniform float uDissipation;
uniform vec3 uBaseColor;
uniform vec3 uGlowColor;
varying vec2 vUv;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec2 curl(vec2 p) {
  float eps = 0.001;
  float n1, n2, a, b;
  n1 = snoise(p + vec2(0, eps)); n2 = snoise(p - vec2(0, eps)); a = (n1 - n2) / (2.0 * eps);
  n1 = snoise(p + vec2(eps, 0)); n2 = snoise(p - vec2(eps, 0)); b = (n1 - n2) / (2.0 * eps);
  return vec2(a, -b);
}

void main() {
  vec2 uv = vUv;
  vec2 flow = curl(uv * 2.0 + uTime * 0.05);
  vec2 newUv = uv - flow * 0.003;
  newUv -= 0.5; newUv *= 0.995; newUv += 0.5;
  vec4 advected = texture2D(uTexture, newUv);

  vec2 mouse = uMouse; mouse.x *= uAspect;
  vec2 curUv = uv; curUv.x *= uAspect;
  float dist = length(curUv - mouse);
  float brush = smoothstep(0.05, 0.0, dist) * uMouseActive;
  vec3 injectColor = mix(uGlowColor, vec3(1.0), 0.5) * brush * 3.0;
  vec3 finalColor = advected.rgb + injectColor;
  finalColor *= uDissipation;
  gl_FragColor = vec4(finalColor, 1.0);
}
    `;

    const displayFragment = `
precision highp float;
uniform sampler2D uTexture;
uniform vec3 uBaseColor;
varying vec2 vUv;

void main() {
  vec4 color = texture2D(uTexture, vUv);
  vec3 c = color.rgb;
  c += uBaseColor * 0.2;
  c = pow(c, vec3(1.4));
  float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
  c += noise * 0.02;
  gl_FragColor = vec4(c, 1.0);
}
    `;

    const vert = `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }`;
    const geometry = new Triangle(gl);

    const simProgram = new Program(gl, {
      vertex: vert,
      fragment: simFragment,
      uniforms: {
        uTexture: { value: null },
        uTime: { value: 0 },
        uMouse: { value: new Vec2(0, 0) },
        uMouseActive: { value: 0 },
        uResolution: { value: new Vec2(0, 0) },
        uAspect: { value: 1 },
        uDissipation: { value: dissipation },
        uBaseColor: { value: new Color(...baseColor) },
        uGlowColor: { value: new Color(...glowColor) },
      },
    });

    const displayProgram = new Program(gl, {
      vertex: vert,
      fragment: displayFragment,
      uniforms: {
        uTexture: { value: null },
        uBaseColor: { value: new Color(...baseColor) },
      },
    });

    const simMesh = new Mesh(gl, { geometry, program: simProgram });
    const displayMesh = new Mesh(gl, { geometry, program: displayProgram });

    const fboArgs = {
      width: window.innerWidth >> 1,
      height: window.innerHeight >> 1,
      type: (gl as WebGLRenderingContext & { HALF_FLOAT?: number }).HALF_FLOAT ?? gl.FLOAT,
      internalFormat: (gl as WebGLRenderingContext & { RGBA16F?: number }).RGBA16F ?? gl.RGBA,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
    };
    let fboRead = new RenderTarget(gl, fboArgs);
    let fboWrite = new RenderTarget(gl, fboArgs);

    const mouse = new Vec2(0, 0);
    const targetMouse = new Vec2(0, 0);
    let isMoving = 0;

    function resize() {
      const w = container?.offsetWidth ?? window.innerWidth;
      const h = container?.offsetHeight ?? window.innerHeight;
      renderer.setSize(w, h);
      fboRead.setSize(w >> 1, h >> 1);
      fboWrite.setSize(w >> 1, h >> 1);
      simProgram.uniforms.uResolution.value.set(w, h);
      simProgram.uniforms.uAspect.value = w / h;
    }
    window.addEventListener('resize', resize);
    resize();
    container?.appendChild(gl.canvas as HTMLCanvasElement);

    function updateMouse(x: number, y: number) {
      targetMouse.set(x / (gl.canvas as HTMLCanvasElement).width, 1.0 - y / (gl.canvas as HTMLCanvasElement).height);
      isMoving = 1.0;
    }

    const onMouseMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => updateMouse(e.touches[0].clientX, e.touches[0].clientY);

    if (interactive) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onTouchMove);
    }

    let animationId: number;

    function update(t: number) {
      animationId = requestAnimationFrame(update);
      const time = t * 0.001;
      mouse.lerp(targetMouse, 0.15);
      if (Math.abs(mouse.x - targetMouse.x) < 0.001) isMoving *= 0.9;
      simProgram.uniforms.uTime.value = time;
      simProgram.uniforms.uMouse.value.copy(mouse);
      simProgram.uniforms.uMouseActive.value = isMoving;
      simProgram.uniforms.uTexture.value = fboRead.texture;
      simProgram.uniforms.uDissipation.value = dissipation;
      renderer.render({ scene: simMesh, target: fboWrite });
      displayProgram.uniforms.uTexture.value = fboWrite.texture;
      renderer.render({ scene: displayMesh });
      const temp = fboRead; fboRead = fboWrite; fboWrite = temp;
    }
    animationId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (interactive) {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('touchmove', onTouchMove);
      }
      (gl as WebGLRenderingContext & { getExtension: (name: string) => { loseContext: () => void } | null })
        .getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [baseColor, glowColor, dissipation, interactive]);

  return <div ref={containerRef} className="w-full h-full" {...props} />;
};

export default InterstellarFluid;
