/**
 * 方块顶点着色器
 */
export const blockVertexShader = /* glsl */ `
uniform float time;

attribute float animFlag; // 1.0 = water, 0.0 = other
attribute float vertexShade;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vFogDepth;
varying float vIsWater;
varying float vVertexShade;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vIsWater = animFlag;
  vVertexShade = vertexShade;

  // Animate water UVs for flow effect
  vec2 animUv = uv;
  if (animFlag > 0.5) {
    // Top face: circular ripple
    if (abs(vNormal.y) > 0.5) {
      animUv.x += sin(time * 1.5 + position.x * 2.0) * 0.02;
      animUv.y += cos(time * 1.5 + position.z * 2.0) * 0.02;
    }
    // Side faces: downward flow
    else {
      animUv.y += time * 0.15;
    }
  }
  vUv = animUv;

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;

  vec4 mvPosition = viewMatrix * worldPos;
  vFogDepth = -mvPosition.z;

  gl_Position = projectionMatrix * mvPosition;
}
`
