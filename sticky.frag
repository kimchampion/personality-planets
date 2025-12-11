// sticky.frag
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTexCoord;

uniform sampler2D tex0;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform vec2 u_imgResolution;
uniform float u_time;
uniform float u_strength;

void main(void) {
  vec2 uv = vTexCoord;

  // aspect correction so image covers canvas
  float imgAspect = u_imgResolution.x / u_imgResolution.y;
  float winAspect = u_resolution.x / u_resolution.y;

  vec2 texUV = uv;

  if (winAspect > imgAspect) {
    float scale = winAspect / imgAspect;
    texUV.y = (uv.y - 0.5) * scale + 0.5;
  } else {
    float scale = imgAspect / winAspect;
    texUV.x = (uv.x - 0.5) * scale + 0.5;
  }

  // center protection zone
  vec2 center = vec2(0.5, 0.5);
  float distOriginalCenter = length(texUV - center);
  float protectRadius  = 0.18;
  float protectFeather = 0.10;

  float insideCenter = distOriginalCenter < protectRadius ? 1.0 : 0.0;

  vec2 delta = texUV - u_mouse;
  float dist = length(delta);
  float radius = 0.5;

  float falloff = smoothstep(radius, 0.0, dist);

  vec2 dir = vec2(0.0);
  if (dist > 0.0001) {
    dir = delta / dist;
  }

  float baseAmount = u_strength;
  float wobble = 0.05 * sin(10.0 * dist - u_time * 4.0);
  float totalAmount = baseAmount + wobble;

  vec2 offset = -dir * totalAmount * falloff * (radius - dist);

  offset *= 1.0 - insideCenter;

  vec2 warpedUV = texUV + offset;

  float distSampleCenter = length(warpedUV - center);
  float allowWarpHere = smoothstep(protectRadius, protectRadius + protectFeather, distSampleCenter);
  warpedUV = mix(texUV, warpedUV, allowWarpHere);

  warpedUV = clamp(warpedUV, 0.0, 1.0);

  gl_FragColor = texture2D(tex0, warpedUV);
}
