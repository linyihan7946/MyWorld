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
uniform vec3 pointLightPositions[32];
uniform vec3 pointLightColors[32];

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vFogDepth;
varying float vIsWater;
varying float vVertexShade;

void main() {
  vec4 texColor = texture2D(atlas, vUv);

  if (texColor.a < 0.1) discard;

  // Water: override color and alpha for translucent look
  float alpha = texColor.a;
  vec3 color = texColor.rgb;
  if (vIsWater > 0.5) {
    // Water: blue tint, semi-transparent
    color = mix(color, vec3(0.15, 0.4, 0.8), 0.4);
    alpha = 0.6;
  }

  // Directional lighting (sun)
  float ndl = max(dot(vNormal, normalize(sunDirection)), 0.0);
  vec3 diffuse = sunColor * ndl * 0.4;
  vec3 ambient = vec3(ambientLight);

  // Face-based shading
  float faceShade = 1.0;
  if (abs(vNormal.y) > 0.5) {
    faceShade = vNormal.y > 0.0 ? 1.0 : 0.5;
  } else if (abs(vNormal.x) > 0.5) {
    faceShade = 0.8;
  } else {
    faceShade = 0.7;
  }

  vec3 localLight = vec3(0.0);
  for (int i = 0; i < 32; i++) {
    if (i >= pointLightCount) break;
    float lightDistance = distance(vWorldPos, pointLightPositions[i]);
    float attenuation = max(0.0, 1.0 - lightDistance / 8.0);
    localLight += pointLightColors[i] * attenuation * attenuation * 1.8;
  }

  vec3 lighting = (ambient + diffuse) * faceShade * vVertexShade + localLight;
  vec3 finalColor = color * lighting;

  // Fog
  float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
  finalColor = mix(finalColor, fogColor, fogFactor);

  gl_FragColor = vec4(finalColor, alpha);
}
`
