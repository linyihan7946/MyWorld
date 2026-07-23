import * as THREE from 'three'
import { blockVertexShader } from './shaders/blockVert'
import { blockFragmentShader } from './shaders/blockFrag'
import { TextureAtlas } from './TextureAtlas'
import { CHUNK_SIZE, CHUNK_HEIGHT, ATLAS_SIZE } from '@/utils/constants'
import { BlockType, getBlockDefinition, isTransparent } from '@/types/blocks'
import { Chunk } from '@/world/Chunk'

const FACES = [
  { dir: [0, 1, 0], name: 'top', normal: [0, 1, 0],
    corners: [[0,1,1], [1,1,1], [1,1,0], [0,1,0]],
    uvs: [[0,1], [1,1], [1,0], [0,0]] },
  { dir: [0, -1, 0], name: 'bottom', normal: [0, -1, 0],
    corners: [[0,0,0], [1,0,0], [1,0,1], [0,0,1]],
    uvs: [[0,1], [1,1], [1,0], [0,0]] },
  { dir: [1, 0, 0], name: 'side', normal: [1, 0, 0],
    corners: [[1,0,1], [1,1,1], [1,1,0], [1,0,0]],
    uvs: [[1,0], [1,1], [0,1], [0,0]] },
  { dir: [-1, 0, 0], name: 'side', normal: [-1, 0, 0],
    corners: [[0,0,0], [0,1,0], [0,1,1], [0,0,1]],
    uvs: [[1,0], [1,1], [0,1], [0,0]] },
  { dir: [0, 0, 1], name: 'side', normal: [0, 0, 1],
    corners: [[0,0,1], [0,1,1], [1,1,1], [1,0,1]],
    uvs: [[0,0], [0,1], [1,1], [1,0]] },
  { dir: [0, 0, -1], name: 'side', normal: [0, 0, -1],
    corners: [[1,0,0], [1,1,0], [0,1,0], [0,0,0]],
    uvs: [[0,0], [0,1], [1,1], [1,0]] },
] as const

export interface ChunkMeshResult {
  opaque: THREE.Mesh | null
  transparent: THREE.Mesh | null
}

export class ChunkMesher {
  private atlas: TextureAtlas

  // Shared materials
  public opaqueMaterial: THREE.ShaderMaterial
  public transparentMaterial: THREE.ShaderMaterial

  constructor(atlas: TextureAtlas) {
    this.atlas = atlas

    const sharedUniforms = {
      atlas: { value: this.atlas.texture },
      atlasSize: { value: ATLAS_SIZE },
      fogColor: { value: new THREE.Color(0x87CEEB) },
      fogNear: { value: 60.0 },
      fogFar: { value: 128.0 },
      sunDirection: { value: new THREE.Vector3(0.5, 1.0, 0.3).normalize() },
      sunColor: { value: new THREE.Color(1.0, 0.95, 0.9) },
      ambientLight: { value: 0.5 },
      time: { value: 0.0 },
      pointLightCount: { value: 0 },
      pointLightPositions: { value: Array.from({ length: 32 }, () => new THREE.Vector3()) },
      pointLightColors: { value: Array.from({ length: 32 }, () => new THREE.Color()) },
    }

    this.opaqueMaterial = new THREE.ShaderMaterial({
      vertexShader: blockVertexShader,
      fragmentShader: blockFragmentShader,
      uniforms: sharedUniforms,
      side: THREE.FrontSide,
      transparent: false,
    })

    this.transparentMaterial = new THREE.ShaderMaterial({
      vertexShader: blockVertexShader,
      fragmentShader: blockFragmentShader,
      uniforms: { ...sharedUniforms, time: { value: 0.0 } },
      side: THREE.FrontSide,
      transparent: true,
      depthTest: true,
      depthWrite: true,
    })
  }

  /**
   * 更新time uniform（水面动画）
   */
  update(time: number): void {
    this.opaqueMaterial.uniforms.time.value = time
    this.transparentMaterial.uniforms.time.value = time
  }

  updateEnvironment(sunDirection: THREE.Vector3, ambientLight: number, fogColor: THREE.Color): void {
    this.opaqueMaterial.uniforms.sunDirection.value.copy(sunDirection)
    this.transparentMaterial.uniforms.sunDirection.value.copy(sunDirection)
    this.opaqueMaterial.uniforms.ambientLight.value = ambientLight
    this.transparentMaterial.uniforms.ambientLight.value = ambientLight
    this.opaqueMaterial.uniforms.fogColor.value.copy(fogColor)
    this.transparentMaterial.uniforms.fogColor.value.copy(fogColor)
  }

  updateLights(lights: Array<{ position: THREE.Vector3; color: THREE.Color }>): void {
    const count = Math.min(32, lights.length)
    for (const material of [this.opaqueMaterial, this.transparentMaterial]) {
      material.uniforms.pointLightCount.value = count
      for (let i = 0; i < count; i++) {
        material.uniforms.pointLightPositions.value[i].copy(lights[i].position)
        material.uniforms.pointLightColors.value[i].copy(lights[i].color)
      }
    }
  }

  generateMesh(chunk: Chunk, neighbors: {
    px?: Chunk; nx?: Chunk; pz?: Chunk; nz?: Chunk
  }): ChunkMeshResult {
    // Opaque geometry data
    const oPos: number[] = [], oNorm: number[] = [], oUvs: number[] = [], oIdx: number[] = []
    const oAnim: number[] = [], oShade: number[] = []
    let oVert = 0

    // Transparent geometry data
    const tPos: number[] = [], tNorm: number[] = [], tUvs: number[] = [], tIdx: number[] = []
    // Per-vertex flag: 1.0 = water (animate), 0.0 = other transparent
    const tAnim: number[] = [], tShade: number[] = []
    let tVert = 0

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const blockType = chunk.getBlock(x, y, z)
          if (blockType === BlockType.AIR) continue

          const def = getBlockDefinition(blockType)
          const isBlockTransparent = isTransparent(blockType)
          const isWater = blockType === BlockType.WATER
          const shapeHeight = blockType === BlockType.REDSTONE_DUST ? 0.025
            : (blockType === BlockType.REPEATER || blockType === BlockType.COMPARATOR ? 0.125 : 1)

          for (const face of FACES) {
            const nx = x + face.dir[0]
            const ny = y + face.dir[1]
            const nz = z + face.dir[2]

            let neighborBlock: number
            if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_HEIGHT && nz >= 0 && nz < CHUNK_SIZE) {
              neighborBlock = chunk.getBlock(nx, ny, nz)
            } else if (nx < 0 && neighbors.nx) {
              neighborBlock = neighbors.nx.getBlock(CHUNK_SIZE - 1, ny, nz)
            } else if (nx >= CHUNK_SIZE && neighbors.px) {
              neighborBlock = neighbors.px.getBlock(0, ny, nz)
            } else if (nz < 0 && neighbors.nz) {
              neighborBlock = neighbors.nz.getBlock(nx, ny, CHUNK_SIZE - 1)
            } else if (nz >= CHUNK_SIZE && neighbors.pz) {
              neighborBlock = neighbors.pz.getBlock(nx, ny, 0)
            } else {
              neighborBlock = BlockType.AIR
            }

            // Face culling logic. Keeping transparent faces front-sided and depth-writing
            // prevents the old x-ray effect through glass, leaves and water.
            if (!isBlockTransparent) {
              // Opaque block: skip face if neighbor is opaque
              if (neighborBlock !== BlockType.AIR && !isTransparent(neighborBlock)) continue
            } else {
              // Transparent block: skip face if neighbor is same type, or is opaque
              if (neighborBlock === blockType) continue
              if (neighborBlock !== BlockType.AIR && !isTransparent(neighborBlock)) continue
            }

            // Get texture index
            let texIndex = 0
            if (def.textures.all !== undefined) {
              texIndex = def.textures.all
            } else if (face.name === 'top' && def.textures.top !== undefined) {
              texIndex = def.textures.top
            } else if (face.name === 'bottom' && def.textures.bottom !== undefined) {
              texIndex = def.textures.bottom
            } else if (def.textures.side !== undefined) {
              texIndex = def.textures.side
            }

            // Atlas UV
            const col = texIndex % ATLAS_SIZE
            const row = Math.floor(texIndex / ATLAS_SIZE)
            const uBase = col / ATLAS_SIZE
            const vBase = 1 - (row + 1) / ATLAS_SIZE
            const uSize = 1 / ATLAS_SIZE
            const vSize = 1 / ATLAS_SIZE

            // Choose target buffers
            const targetPos = isBlockTransparent ? tPos : oPos
            const targetNorm = isBlockTransparent ? tNorm : oNorm
            const targetUvs = isBlockTransparent ? tUvs : oUvs
            const targetIdx = isBlockTransparent ? tIdx : oIdx
            const targetShade = isBlockTransparent ? tShade : oShade
            let vertCount = isBlockTransparent ? tVert : oVert

            const inset = 0.001
            for (let i = 0; i < 4; i++) {
              const corner = face.corners[i]
              const faceUv = face.uvs[i]

              // Water surface: lower the top face slightly for visual effect
              let py = y + corner[1] * shapeHeight
              if (isWater && face.name === 'top') {
                py = y + 0.85
              }

              targetPos.push(x + corner[0], py, z + corner[2])
              targetNorm.push(face.normal[0], face.normal[1], face.normal[2])

              const atlasU = uBase + faceUv[0] * uSize
              const atlasV = vBase + faceUv[1] * vSize
              const centerU = uBase + uSize * 0.5
              const centerV = vBase + vSize * 0.5
              targetUvs.push(
                atlasU + (centerU - atlasU) * inset * 100,
                atlasV + (centerV - atlasV) * inset * 100,
              )

              // Track water faces for animation
              if (isBlockTransparent) {
                tAnim.push(isWater ? 1.0 : 0.0)
              } else {
                oAnim.push(0.0)
              }

              // A subtle per-vertex contact shade makes cube edges and corners readable
              // without adding expensive extra geometry.
              const verticalShade = corner[1] === 0 ? 0.9 : 1.0
              const edgeShade = ((corner[0] + corner[2]) % 2 === 0) ? 0.94 : 1.0
              targetShade.push(verticalShade * edgeShade)
            }

            // The four vertical face definitions are ordered clockwise when seen
            // from outside, unlike the top/bottom faces. Reverse their triangle
            // winding so FrontSide culling keeps every exterior face visible.
            if (face.dir[1] === 0) {
              targetIdx.push(
                vertCount, vertCount + 2, vertCount + 1,
                vertCount, vertCount + 3, vertCount + 2,
              )
            } else {
              targetIdx.push(
                vertCount, vertCount + 1, vertCount + 2,
                vertCount, vertCount + 2, vertCount + 3,
              )
            }

            if (isBlockTransparent) {
              tVert += 4
            } else {
              oVert += 4
            }
          }
        }
      }
    }

    const offset = new THREE.Vector3(chunk.chunkX * CHUNK_SIZE, 0, chunk.chunkZ * CHUNK_SIZE)

    // Build opaque mesh
    let opaqueMesh: THREE.Mesh | null = null
    if (oPos.length > 0) {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(oPos, 3))
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(oNorm, 3))
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(oUvs, 2))
      geo.setAttribute('animFlag', new THREE.Float32BufferAttribute(oAnim, 1))
      geo.setAttribute('vertexShade', new THREE.Float32BufferAttribute(oShade, 1))
      geo.setIndex(oIdx)
      opaqueMesh = new THREE.Mesh(geo, this.opaqueMaterial)
      opaqueMesh.position.copy(offset)
      opaqueMesh.frustumCulled = true
    }

    // Build transparent mesh
    let transparentMesh: THREE.Mesh | null = null
    if (tPos.length > 0) {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(tPos, 3))
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(tNorm, 3))
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(tUvs, 2))
      geo.setAttribute('animFlag', new THREE.Float32BufferAttribute(tAnim, 1))
      geo.setAttribute('vertexShade', new THREE.Float32BufferAttribute(tShade, 1))
      geo.setIndex(tIdx)
      transparentMesh = new THREE.Mesh(geo, this.transparentMaterial)
      transparentMesh.position.copy(offset)
      transparentMesh.frustumCulled = true
      transparentMesh.renderOrder = 1 // Render after opaque
    }

    return { opaque: opaqueMesh, transparent: transparentMesh }
  }

  disposeMesh(mesh: THREE.Mesh | null): void {
    if (!mesh) return
    mesh.geometry.dispose()
    // Don't dispose shared materials
  }
}
