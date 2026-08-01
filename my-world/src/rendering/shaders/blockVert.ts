/**
 * 方块顶点着色器
 * 新增：vHeight 传递给片段着色器用于天空光计算
 */
export const blockVertexShader = /* glsl */ `
uniform float time;

attribute float animFlag;
attribute float ao;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vFogDepth;
varying float vIsWater;
varying float vAO;
varying float vHeight;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vIsWater = animFlag;
  vAO = ao;

  vec2 animUv = uv;
  if (animFlag > 0.5) {
    if (abs(vNormal.y) > 0.5) {
      animUv.x += sin(time * 1.5 + position.x * 2.0) * 0.02;
      animUv.y += cos(time * 1.5 + position.z * 2.0) * 0.02;
    } else {
      animUv.y += time * 0.15;
    }
  }
  vUv = animUv;

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vHeight = worldPos.y;  // 传递绝对Y坐标

  vec4 mvPosition = viewMatrix * worldPos;
  vFogDepth = -mvPosition.z;

  gl_Position = projectionMatrix * mvPosition;
}
`
