/**
 * 方块片段着色器 — 增强光照版
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
uniform vec3 pointLightPositions[8];
uniform vec3 pointLightColors[8];
uniform vec3 uCameraPos; // 相机位置（自定义名称避免与Three.js内置冲突）

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vFogDepth;
varying float vIsWater;
varying float vAO;
varying float vHeight;

void main() {
  vec4 texColor = texture2D(atlas, vUv);

  if (texColor.a < 0.1) discard;

  float alpha = texColor.a;
  vec3 color = texColor.rgb;
  if (vIsWater > 0.5) {
    color = mix(color, vec3(0.12, 0.42, 0.82), 0.5);
    alpha = 0.5;
  }

  vec3 N = normalize(vNormal);
  vec3 L = normalize(sunDirection);
  float ndl = max(dot(N, L), 0.0);

  // 环境光 + 漫反射
  float diffuseStrength = mix(0.22, 0.65, ndl);
  vec3 diffuse = sunColor * diffuseStrength;
  vec3 ambient = vec3(ambientLight * 1.15);

  // 天空光：Y 越高越亮
  float skyLight = smoothstep(0.0, 128.0, vHeight) * 0.18;
  float topFacing = smoothstep(0.6, 1.0, N.y);
  skyLight += topFacing * 0.12;

  // 镜面高光
  vec3 V = normalize(uCameraPos - vWorldPos);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 32.0);
  float specOcclusion = mix(0.3, 1.0, vAO);
  vec3 specular = sunColor * spec * 0.25 * specOcclusion;

  // 面的方向性偏置
  float faceShade = 1.0;
  float ay = abs(N.y);
  if (ay > 0.5) {
    faceShade = N.y > 0.0 ? 1.0 : 0.62;
  } else if (abs(N.x) > 0.5) {
    faceShade = 0.86;
  } else {
    faceShade = 0.78;
  }

  // 局部点光源
  vec3 localLight = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    if (i >= pointLightCount) break;
    vec3 diff = vWorldPos - pointLightPositions[i];
    float distSq = dot(diff, diff);
    if (distSq > 72.0) continue;
    float dist = sqrt(distSq);
    float attenuation = 1.0 - dist / 8.485;
    if (attenuation <= 0.0) continue;
    attenuation *= attenuation;
    localLight += pointLightColors[i] * attenuation * 3.5;
  }

  // 合成 — AO 最小值从 0.45 提升到 0.58，让暗面仍然可见
  float aoFactor = mix(0.58, 1.0, vAO);
  vec3 sunLighting = (ambient + diffuse + skyLight) * faceShade * aoFactor + specular;
  vec3 finalColor = color * (sunLighting + localLight);

  // 距离雾
  float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
  finalColor = mix(finalColor, fogColor, fogFactor);

  gl_FragColor = vec4(finalColor, alpha);
}
`
