/**
 * 方块片段着色器
 */
export const blockFragmentShader = /* glsl */ `
uniform sampler2D atlas;
uniform float atlasSize;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform float ambientLight;
uniform int pointLightCount;
uniform vec3 pointLightPositions[16];
uniform vec3 pointLightColors[16];

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vFogDepth;
varying float vIsWater;
varying float vAO;

void main() {
  vec4 texColor = texture2D(atlas, vUv);

  if (texColor.a < 0.1) discard;

  float alpha = texColor.a;
  vec3 color = texColor.rgb;
  if (vIsWater > 0.5) {
    color = mix(color, vec3(0.12, 0.35, 0.75), 0.45);
    alpha = 0.55;
  }

  // ── Directional sun light ──
  float ndl = max(dot(vNormal, normalize(sunDirection)), 0.0);
  vec3 diffuse = sunColor * mix(0.15, 0.55, ndl);
  vec3 ambient = vec3(ambientLight);

  // Face-based directional bias (preserves cube readability)
  float faceShade = 1.0;
  if (abs(vNormal.y) > 0.5) {
    faceShade = vNormal.y > 0.0 ? 1.0 : 0.5;
  } else if (abs(vNormal.x) > 0.5) {
    faceShade = 0.8;
  } else {
    faceShade = 0.7;
  }

  // ── Local point lights ──
  // 缩减到 16 盏；用距离平方提前跳过远距离灯
  vec3 localLight = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    if (i >= pointLightCount) break;
    vec3 diff = vWorldPos - pointLightPositions[i];
    float distSq = dot(diff, diff);
    if (distSq > 64.0) continue;
    float attenuation = 1.0 - sqrt(distSq) * 0.125;
    if (attenuation <= 0.0) continue;
    attenuation *= attenuation;
    localLight += pointLightColors[i] * attenuation * 2.0;
  }

  // ── Combine ──
  float aoFactor = mix(0.5, 1.0, vAO);
  vec3 sunLighting = (ambient + diffuse) * faceShade * aoFactor;
  vec3 finalColor = color * (sunLighting + localLight);

  // ── Distance fog ──
  float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
  finalColor = mix(finalColor, fogColor, fogFactor);

  gl_FragColor = vec4(finalColor, alpha);
}
`
