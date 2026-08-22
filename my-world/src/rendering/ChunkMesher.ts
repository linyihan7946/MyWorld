import * as THREE from 'three'
import { blockVertexShader } from './shaders/blockVert'
import { blockFragmentShader } from './shaders/blockFrag'
import { TextureAtlas } from './TextureAtlas'
import { CHUNK_SIZE, CHUNK_HEIGHT, ATLAS_SIZE } from '@/utils/constants'
import { BlockType, getBlockDefinition, isTransparent } from '@/types/blocks'
import { getDustPower } from '@/gameplay/redstonePower'
import { getBlockState } from '@/gameplay/BlockStateSystem'
import type { Chunk } from '@/world/Chunk'

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

type NeighborChunks = { px?: Chunk; nx?: Chunk; pz?: Chunk; nz?: Chunk }
type BlockBounds = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }

export class ChunkMesher {
  private atlas: TextureAtlas

  public opaqueMaterial: THREE.ShaderMaterial
  public transparentMaterial: THREE.ShaderMaterial

  constructor(atlas: TextureAtlas) {
    this.atlas = atlas

    const sharedUniforms = {
      atlas: { value: this.atlas.texture },
      atlasSize: { value: ATLAS_SIZE },
      fogColor: { value: new THREE.Color(0x87CEEB) },
      fogNear: { value: 48.0 },
      fogFar: { value: 200.0 },
      sunDirection: { value: new THREE.Vector3(0.5, 1.0, 0.3).normalize() },
      sunColor: { value: new THREE.Color(1.0, 0.97, 0.92) },
      ambientLight: { value: 0.5 },
      uCameraPos: { value: new THREE.Vector3() },
      time: { value: 0.0 },
      pointLightCount: { value: 0 },
      pointLightPositions: { value: Array.from({ length: 8 }, () => new THREE.Vector3()) },
      pointLightColors: { value: Array.from({ length: 8 }, () => new THREE.Color()) },
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

  update(time: number): void {
    this.opaqueMaterial.uniforms.time.value = time
    this.transparentMaterial.uniforms.time.value = time
  }

  updateEnvironment(sunDirection: THREE.Vector3, ambientLight: number, fogColor: THREE.Color): void {
    for (const mat of [this.opaqueMaterial, this.transparentMaterial]) {
      mat.uniforms.sunDirection.value.copy(sunDirection)
      mat.uniforms.ambientLight.value = ambientLight
      mat.uniforms.fogColor.value.copy(fogColor)
    }
  }

  updateCamera(cameraPos: THREE.Vector3): void {
    this.opaqueMaterial.uniforms.uCameraPos.value.copy(cameraPos)
    this.transparentMaterial.uniforms.uCameraPos.value.copy(cameraPos)
  }

  updateLights(lights: Array<{ position: THREE.Vector3; color: THREE.Color }>): void {
    const count = Math.min(8, lights.length)
    for (const material of [this.opaqueMaterial, this.transparentMaterial]) {
      material.uniforms.pointLightCount.value = count
      for (let i = 0; i < count; i++) {
        material.uniforms.pointLightPositions.value[i].copy(lights[i].position)
        material.uniforms.pointLightColors.value[i].copy(lights[i].color)
      }
    }
  }

  // ─── Block lookup across chunk boundaries ───

  private getBlockAt(
    chunk: Chunk, neighbors: NeighborChunks,
    wx: number, wy: number, wz: number,
  ): number {
    const localX = wx - chunk.chunkX * CHUNK_SIZE
    const localZ = wz - chunk.chunkZ * CHUNK_SIZE

    if (wy < 0 || wy >= CHUNK_HEIGHT) return BlockType.AIR

    if (localX >= 0 && localX < CHUNK_SIZE && localZ >= 0 && localZ < CHUNK_SIZE) {
      return chunk.getBlock(localX, wy, localZ)
    }
    if (localX < 0 && neighbors.nx) return neighbors.nx.getBlock(CHUNK_SIZE - 1, wy, localZ)
    if (localX >= CHUNK_SIZE && neighbors.px) return neighbors.px.getBlock(0, wy, localZ)
    if (localZ < 0 && neighbors.nz) return neighbors.nz.getBlock(localX, wy, CHUNK_SIZE - 1)
    if (localZ >= CHUNK_SIZE && neighbors.pz) return neighbors.pz.getBlock(localX, wy, 0)
    return BlockType.AIR
  }

  private isSolidAO(block: number): boolean {
    if (block === BlockType.AIR || block === BlockType.BARRIER) return false
    return !isTransparent(block)
  }

  private isDoor(block: BlockType): boolean {
    return block >= BlockType.OAK_DOOR && block <= BlockType.IRON_DOOR
  }

  private isTrapdoor(block: BlockType): boolean {
    return block >= BlockType.OAK_TRAPDOOR && block <= BlockType.IRON_TRAPDOOR
  }

  /** 返回非完整方块的实际渲染范围。朝向：0 北、1 南、2 东、3 西。 */
  private getSpecialBounds(block: BlockType, wx: number, wy: number, wz: number): BlockBounds | null {
    const thickness = 3 / 16
    const state = getBlockState(wx, wy, wz)
    const facing = state.facing ?? 0

    if (block === BlockType.LADDER) {
      const ladderThickness = 1 / 16
      if (facing === 1) return { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 1 - ladderThickness, maxZ: 1 }
      if (facing === 2) return { minX: 1 - ladderThickness, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 1 }
      if (facing === 3) return { minX: 0, maxX: ladderThickness, minY: 0, maxY: 1, minZ: 0, maxZ: 1 }
      return { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: ladderThickness }
    }

    if (this.isDoor(block)) {
      const direction = (facing + (state.open ? 1 : 0)) % 4
      if (direction === 1) return { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 1 - thickness, maxZ: 1 }
      if (direction === 2) return { minX: 1 - thickness, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 1 }
      if (direction === 3) return { minX: 0, maxX: thickness, minY: 0, maxY: 1, minZ: 0, maxZ: 1 }
      return { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: thickness }
    }

    if (this.isTrapdoor(block)) {
      if (!state.open) {
        return state.half === 'top'
          ? { minX: 0, maxX: 1, minY: 1 - thickness, maxY: 1, minZ: 0, maxZ: 1 }
          : { minX: 0, maxX: 1, minY: 0, maxY: thickness, minZ: 0, maxZ: 1 }
      }
      if (facing === 1) return { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 1 - thickness, maxZ: 1 }
      if (facing === 2) return { minX: 1 - thickness, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 1 }
      if (facing === 3) return { minX: 0, maxX: thickness, minY: 0, maxY: 1, minZ: 0, maxZ: 1 }
      return { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: thickness }
    }

    return null
  }

  // ─── Minecraft-style vertex Ambient Occlusion ───

  /**
   * For a face vertex at world position (bx,by,bz)+(cx,cy,cz), check the 3 blocks
   * outside the face that share this vertex and compute an AO value 0..1.
   * 0 = fully occluded (dark corner), 1 = fully exposed.
   */
  private computeAO(
    chunk: Chunk, neighbors: NeighborChunks,
    bx: number, by: number, bz: number,   // block world origin
    nx: number, ny: number, nz: number,    // face normal
    cx: number, cy: number, cz: number,   // corner coords (each 0 or 1)
  ): number {
    // The 8 blocks that share vertex (bx+cx, by+cy, bz+cz) have offsets
    // dx ∈ {cx-1, cx}, dy ∈ {cy-1, cy}, dz ∈ {cz-1, cz}.
    // Of these, (0,0,0) is our block and (nx,ny,nz) is the neighbour through the face.
    // The 3 AO blocks are the remaining three whose coordinate along the face-normal
    // equals 0 (our block's level, not the neighbour's level).
    const offsets: [number, number, number][] = []
    for (const dx of [cx - 1, cx]) {
      for (const dy of [cy - 1, cy]) {
        for (const dz of [cz - 1, cz]) {
          if (dx === 0 && dy === 0 && dz === 0) continue
          if (dx === nx && dy === ny && dz === nz) continue
          if ((nx !== 0 && dx !== 0) || (ny !== 0 && dy !== 0) || (nz !== 0 && dz !== 0)) continue
          offsets.push([dx, dy, dz])
        }
      }
    }

    // Identify side1, side2 (share an edge) and corner (only vertex contact).
    // A "corner" block is the one where BOTH non-face-normal offsets differ
    // from our block (which is always at offset 0 for every axis vs. itself).
    const isCorner = (o: [number, number, number]): boolean => {
      let nonZero = 0
      if (nx === 0 && o[0] !== 0) nonZero++
      if (ny === 0 && o[1] !== 0) nonZero++
      if (nz === 0 && o[2] !== 0) nonZero++
      return nonZero === 2
    }

    let side1 = false, side2 = false, cornerBlock = false
    for (const o of offsets) {
      const solid = this.isSolidAO(this.getBlockAt(chunk, neighbors, bx + o[0], by + o[1], bz + o[2]))
      if (isCorner(o)) cornerBlock = solid
      else if (!side1) side1 = solid
      else side2 = solid
    }

    // Classic MC AO formula
    if (side1 && side2) return 0.0
    let ao = 1.0
    if (side1) ao -= 0.3
    if (side2) ao -= 0.3
    if (cornerBlock) ao -= 0.3
    return Math.max(0.0, ao)
  }

  generateMesh(chunk: Chunk, neighbors: NeighborChunks, showBarriers = false): ChunkMeshResult {
    // Opaque geometry data
    const oPos: number[] = [], oNorm: number[] = [], oUvs: number[] = [], oIdx: number[] = []
    const oAnim: number[] = [], oShade: number[] = []
    let oVert = 0

    // Transparent geometry data
    const tPos: number[] = [], tNorm: number[] = [], tUvs: number[] = [], tIdx: number[] = []
    const tAnim: number[] = [], tShade: number[] = []
    let tVert = 0

    // 高度图：每列最高非空气方块，用于限制 Y 扫描上限
    let hasHeightmap = false
    if (chunk.heightmap) {
      for (let i = 0; i < chunk.heightmap.length; i++) {
        if (chunk.heightmap[i] >= 0) { hasHeightmap = true; break }
      }
    }

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          // 如果此列的 heightmap < 当前 y，则本列在此高度以上全为空
          if (hasHeightmap && chunk.heightmap[z * CHUNK_SIZE + x] < y) continue

          const blockType = chunk.getBlock(x, y, z)
          if (blockType === BlockType.AIR) continue

          // 屏障方块：未手持屏障时不渲染，但仍作为固体参与面剔除
          if (blockType === BlockType.BARRIER && !showBarriers) continue

          const def = getBlockDefinition(blockType)
          // 屏障手持时作为透明方块渲染
          const isBlockTransparent = blockType === BlockType.BARRIER ? true : isTransparent(blockType)
          const isWater = blockType === BlockType.WATER
          const shapeHeight = blockType === BlockType.REDSTONE_DUST ? 0.025
            : (blockType === BlockType.REPEATER || blockType === BlockType.COMPARATOR ? 0.125 : 1)
          const bx = chunk.chunkX * CHUNK_SIZE + x
          const bz = chunk.chunkZ * CHUNK_SIZE + z
          const specialBounds = this.getSpecialBounds(blockType, bx, y, bz)

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
            // 屏障方块始终视为透明块，不遮挡相邻面
            const isNeighborBarrier = neighborBlock === BlockType.BARRIER
            const neighborOpaque = isNeighborBarrier
              ? false  // 屏障永远不遮挡相邻面（像空气一样透明）
              : (neighborBlock !== BlockType.AIR && !isTransparent(neighborBlock))

            if (this.isDoor(blockType) && neighborBlock === blockType && (face.name === 'top' || face.name === 'bottom')) {
              continue
            } else if (specialBounds) {
              // 薄片模型必须保留贴着支撑方块的一面，不能按完整立方体规则剔除。
            } else if (!isBlockTransparent) {
              // Opaque block: skip face if neighbor is opaque
              if (neighborOpaque) continue
            } else {
              // Transparent block: skip face if neighbor is same type, or is opaque
              if (neighborBlock === blockType) continue
              if (neighborOpaque) continue
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
            const targetAO = isBlockTransparent ? tShade : oShade
            let vertCount = isBlockTransparent ? tVert : oVert

            const inset = 0.001
            for (let i = 0; i < 4; i++) {
              const corner = face.corners[i]
              const faceUv = face.uvs[i]

              const localX = specialBounds
                ? specialBounds.minX + corner[0] * (specialBounds.maxX - specialBounds.minX)
                : corner[0]
              const localY = specialBounds
                ? specialBounds.minY + corner[1] * (specialBounds.maxY - specialBounds.minY)
                : corner[1] * shapeHeight
              const localZ = specialBounds
                ? specialBounds.minZ + corner[2] * (specialBounds.maxZ - specialBounds.minZ)
                : corner[2]
              let py = y + localY
              if (isWater && face.name === 'top') {
                py = y + 0.85
              }

              targetPos.push(x + localX, py, z + localZ)
              targetNorm.push(face.normal[0], face.normal[1], face.normal[2])

              const atlasU = uBase + faceUv[0] * uSize
              const atlasV = vBase + faceUv[1] * vSize
              const centerU = uBase + uSize * 0.5
              const centerV = vBase + vSize * 0.5
              targetUvs.push(
                atlasU + (centerU - atlasU) * inset * 100,
                atlasV + (centerV - atlasV) * inset * 100,
              )

              if (isBlockTransparent) {
                tAnim.push(isWater ? 1.0 : 0.0)
              } else {
                oAnim.push(0.0)
              }

              // Minecraft-style vertex AO
              let ao: number
              if (isBlockTransparent) {
                // 透明方块不受 AO 影响; 红石粉尘按能量等级点亮 (0=暗红, 15=最亮)
                ao = blockType === BlockType.REDSTONE_DUST
                  ? 0.35 + 0.65 * (getDustPower(bx, y, bz) / 15)
                  : 1.0
              } else {
                ao = this.computeAO(
                  chunk, neighbors,
                  bx, y, bz,
                  face.dir[0], face.dir[1], face.dir[2],
                  corner[0], corner[1], corner[2],
                )
              }
              targetAO.push(ao)
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
      geo.setAttribute('ao', new THREE.Float32BufferAttribute(oShade, 1))
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
      geo.setAttribute('ao', new THREE.Float32BufferAttribute(tShade, 1))
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
