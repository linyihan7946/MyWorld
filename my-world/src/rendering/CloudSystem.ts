import * as THREE from 'three'

/**
 * CloudSystem — procedural cloud layer that follows the player.
 * Uses a flat plane with a fractal-noise shader to produce
 * volumetric-looking cloud shapes.
 */
export class CloudSystem {
  public mesh: THREE.Mesh
  private material: THREE.ShaderMaterial

  /** 0 = clear sky, 1 = fully overcast */
  public coverage = 0.35

  /** Weather modifier: > 0 darkens + thickens clouds (rain / thunder) */
  public weatherIntensity = 0

  constructor() {
    const size = 512
    const geo = new THREE.PlaneGeometry(size, size)

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWind: { value: new THREE.Vector2(0.6, 0.15) },
        uCoverage: { value: this.coverage },
        uWeather: { value: 0 },
        uDaylight: { value: 1.0 },
        uSunDirection: { value: new THREE.Vector3(0.5, 0.7, 0.3) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        uniform float uTime;
        uniform vec2  uWind;
        uniform float uCoverage;
        uniform float uWeather;
        uniform float uDaylight;
        uniform vec3  uSunDirection;

        // ── Hash & noise ──
        float hash(vec2 p) {
          float h = dot(p, vec2(127.1, 311.7));
          return fract(sin(h) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amp   = 0.5;
          float freq  = 1.0;
          for (int i = 0; i < 5; i++) {
            value += amp * noise(p * freq);
            freq *= 2.1;
            amp  *= 0.48;
          }
          return value;
        }

        void main() {
          vec2 uv = vUv;

          // Sample two noise layers at different scales/offsets
          vec2 windOffset = uWind * uTime * 0.03;
          float n1 = fbm(uv * 6.0  + windOffset);
          float n2 = fbm(uv * 12.0 + windOffset * 1.7 + 3.2);

          // Build cloud density: subtractive edges, bright middle
          float density = n1 * 0.7 + n2 * 0.3;
          density = smoothstep(0.28, 0.62, density) * (1.0 - smoothstep(0.62, 0.78, density));

          // Scale by coverage + weather boost
          float effectiveCoverage = uCoverage + uWeather * 0.5;
          density *= effectiveCoverage * 1.6;

          // Edge softening
          float edgeFade = 1.0 - smoothstep(0.35, 0.55, abs(uv.y - 0.5) * 2.0);
          density *= edgeFade;

          // Cloud colour: white with a hint of the sky tint
          float brightness = uDaylight * 0.85 + 0.15;
          vec3 cloudColor = mix(
            vec3(0.35, 0.38, 0.45),   // dark stormy
            mix(
              vec3(0.75, 0.78, 0.82), // overcast grey
              vec3(0.95, 0.96, 1.0),  // bright white
              uDaylight
            ),
            uDaylight
          );

          // Rim-lighting from sun
          float rim = max(0.0, uSunDirection.y) * 0.35;
          cloudColor += rim * density * 0.25;

          float alpha = clamp(density, 0.0, 1.0);
          // Weather darkening
          cloudColor = mix(cloudColor, cloudColor * 0.5, uWeather);

          gl_FragColor = vec4(cloudColor * brightness, alpha * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    this.mesh = new THREE.Mesh(geo, this.material)
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.y = 180
    this.mesh.renderOrder = 999 // render after everything else
  }

  /**
   * Update per frame — follow the camera, advance time, sync with sky.
   */
  update(cameraPos: THREE.Vector3, dt: number, daylight: number, sunDir: THREE.Vector3): void {
    this.mesh.position.x = cameraPos.x
    this.mesh.position.z = cameraPos.z

    this.material.uniforms.uTime.value += dt
    this.material.uniforms.uDaylight.value = daylight
    this.material.uniforms.uSunDirection.value.copy(sunDir)
    this.material.uniforms.uCoverage.value = this.coverage
    this.material.uniforms.uWeather.value += (this.weatherIntensity - this.material.uniforms.uWeather.value) * Math.min(dt * 3, 1)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
