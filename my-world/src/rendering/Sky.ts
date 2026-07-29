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
        weatherIntensity: { value: 0.0 },
        weatherType: { value: 0.0 }, // 0=clear, 1=rain, 2=snow, 3=thunder
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
        uniform float weatherIntensity;
        uniform float weatherType; // 0=clear, 1=rain, 2=snow, 3=thunder
        varying vec3 vDirection;

        float starNoise(vec3 p) {
          vec3 cell = floor(p * 260.0);
          return fract(sin(dot(cell, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }

        void main() {
          vec3 dir = normalize(vDirection);
          float h = dir.y;

          // ── Base sky colours ──
          vec3 dayTop     = vec3(0.22, 0.50, 0.92);
          vec3 dayHorizon = vec3(0.55, 0.72, 0.95);
          vec3 duskTop    = vec3(0.08, 0.15, 0.42);
          vec3 duskHorizon= vec3(0.70, 0.42, 0.22);
          vec3 nightTop   = vec3(0.008, 0.012, 0.06);
          vec3 nightHorizon= vec3(0.03, 0.05, 0.12);

          // Weather-tinted sky bases
          vec3 rainTop     = vec3(0.12, 0.18, 0.28);
          vec3 rainHorizon = vec3(0.28, 0.35, 0.42);
          vec3 snowTop     = vec3(0.42, 0.52, 0.62);
          vec3 snowHorizon = vec3(0.62, 0.70, 0.78);
          vec3 thunderTop  = vec3(0.02, 0.03, 0.08);
          vec3 thunderHorizon = vec3(0.06, 0.08, 0.14);

          // Choose weather sky
          float r = weatherType < 0.5 ? 0.0 : (weatherType < 1.5 ? 1.0 : (weatherType < 2.5 ? 2.0 : 3.0));
          vec3 wtTop = r < 0.5 ? dayTop : (r < 1.5 ? rainTop : (r < 2.5 ? snowTop : thunderTop));
          vec3 wtHorizon = r < 0.5 ? dayHorizon : (r < 1.5 ? rainHorizon : (r < 2.5 ? snowHorizon : thunderHorizon));

          float dusk = 1.0 - abs(dayFactor - 0.5) * 2.0;
          dusk = pow(dusk, 0.6);

          // Blend clear-sky into weather sky
          vec3 clearTop = mix(mix(nightTop, duskTop, dusk), dayTop, dayFactor);
          vec3 clearHorizon = mix(mix(nightHorizon, duskHorizon, dusk), dayHorizon, dayFactor);
          vec3 weatherTop = mix(mix(nightTop, duskTop * 0.6, dusk), wtTop, dayFactor);
          vec3 weatherHorizon = mix(mix(nightHorizon, duskHorizon * 0.5, dusk), wtHorizon, dayFactor);

          vec3 topColor     = mix(clearTop, weatherTop, weatherIntensity);
          vec3 horizonColor = mix(clearHorizon, weatherHorizon, weatherIntensity);

          float hCurve = pow(clamp(h, 0.0, 1.0), 0.45);
          vec3 color = mix(horizonColor, topColor, hCurve);

          float horizonGlow = exp(-abs(h) * 8.0) * 0.35;
          color += horizonColor * horizonGlow;

          // ── Sun (dimmed by weather) ──
          vec3 sunPos = normalize(sunDirection);
          float sunDot = max(dot(dir, sunPos), 0.0);
          float sunDim = 1.0 - weatherIntensity * 0.8;
          color += vec3(1.0, 0.95, 0.78) * pow(sunDot, 500.0) * dayFactor * sunDim * 1.2;
          color += vec3(1.0, 0.85, 0.55) * pow(sunDot, 48.0)  * dayFactor * sunDim * 0.18;
          color += vec3(1.0, 0.72, 0.45) * pow(sunDot, 8.0)   * dayFactor * sunDim * 0.08;

          // ── Moon ──
          float moonDim = 1.0 - weatherIntensity * 0.9;
          float moonDot = max(dot(dir, -sunPos), 0.0);
          color += vec3(0.75, 0.80, 0.95) * pow(moonDot, 520.0) * (1.0 - dayFactor) * moonDim;
          color += vec3(0.55, 0.60, 0.78) * pow(moonDot, 36.0)  * (1.0 - dayFactor) * moonDim * 0.12;

          // ── Stars (hidden by weather clouds) ──
          float starVis = smoothstep(0.0, 0.18, h) * smoothstep(0.0, 0.35, 1.0 - dayFactor);
          starVis *= 1.0 - weatherIntensity * 0.85;
          float starField = step(0.992, starNoise(dir));
          float starTwinkle = fract(sin(dot(dir * 790.0, vec3(17.0, 31.0, 53.0))) * 9631.0);
          starField *= 0.6 + starTwinkle * 0.4;
          color += vec3(starField) * starVis * 0.85;

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

  updateCycle(dayFactor: number, sunDirection: THREE.Vector3, weatherIntensity = 0, weatherType = 0): void {
    this.material.uniforms.dayFactor.value = dayFactor
    this.material.uniforms.sunDirection.value.copy(sunDirection)
    this.material.uniforms.weatherIntensity.value = weatherIntensity
    this.material.uniforms.weatherType.value = weatherType
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
