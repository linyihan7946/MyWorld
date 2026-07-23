import * as THREE from 'three'

/**
 * Sky - 天空渲染
 */
export class Sky {
  public mesh: THREE.Mesh
  private material: THREE.ShaderMaterial

  constructor() {
    const geometry = new THREE.SphereGeometry(500, 32, 32)

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        dayFactor: { value: 1.0 },
        sunDirection: { value: new THREE.Vector3(0.5, 0.7, 0.3).normalize() },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float dayFactor;
        uniform vec3 sunDirection;
        varying vec3 vDirection;

        float starNoise(vec3 p) {
          vec3 cell = floor(p * 260.0);
          return fract(sin(dot(cell, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }

        void main() {
          vec3 direction = normalize(vDirection);
          float h = direction.y;

          vec3 dayTop = vec3(0.25, 0.55, 0.95);
          vec3 dayHorizon = vec3(0.6, 0.8, 1.0);
          vec3 nightTop = vec3(0.008, 0.012, 0.06);
          vec3 nightHorizon = vec3(0.03, 0.05, 0.12);
          vec3 topColor = mix(nightTop, dayTop, dayFactor);
          vec3 horizonColor = mix(nightHorizon, dayHorizon, dayFactor);

          vec3 color = mix(horizonColor, topColor, pow(max(h, 0.0), 0.5));
          color *= 0.7 + max(h, 0.0) * 0.3;

          float sunDot = max(dot(direction, normalize(sunDirection)), 0.0);
          color += vec3(1.0, 0.9, 0.65) * pow(sunDot, 320.0) * dayFactor;
          color += vec3(1.0, 0.65, 0.35) * pow(sunDot, 12.0) * dayFactor * 0.25;

          float moonDot = max(dot(direction, -normalize(sunDirection)), 0.0);
          color += vec3(0.65, 0.72, 0.9) * pow(moonDot, 420.0) * (1.0 - dayFactor);

          float stars = step(0.994, starNoise(direction)) * smoothstep(0.0, 0.25, h);
          color += vec3(stars) * (1.0 - dayFactor) * 0.9;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    })

    this.mesh = new THREE.Mesh(geometry, this.material)
  }

  /**
   * 让天空始终跟随相机
   */
  updatePosition(cameraPosition: THREE.Vector3): void {
    this.mesh.position.copy(cameraPosition)
  }

  updateCycle(dayFactor: number, sunDirection: THREE.Vector3): void {
    this.material.uniforms.dayFactor.value = dayFactor
    this.material.uniforms.sunDirection.value.copy(sunDirection)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
