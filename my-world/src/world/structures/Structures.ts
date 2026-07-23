import { Chunk } from '../Chunk'
import { BlockType } from '@/types/blocks'
import { CHUNK_SIZE } from '@/utils/constants'

/**
 * StructureBlock - 结构模板中的方块
 */
export interface StructureBlock {
  x: number
  y: number
  z: number
  type: BlockType
}

/**
 * Structure - 建筑物基类
 */
export abstract class Structure {
  public name: string
  public blocks: StructureBlock[] = []
  public width: number
  public height: number
  public depth: number

  constructor(name: string, width: number, height: number, depth: number) {
    this.name = name
    this.width = width
    this.height = height
    this.depth = depth
  }

  /**
   * 生成结构方块（子类实现）
   */
  abstract generate(): void

  /**
   * 将结构放置到区块中
   * 放置前会清理结构范围内的水/空气，并铺设地基
   */
  placeInChunk(chunk: Chunk, originX: number, originY: number, originZ: number, prepareSurface = true): void {
    if (!prepareSurface) {
      for (const block of this.blocks) {
        const wy = originY + block.y
        const lx = originX + block.x
        const lz = originZ + block.z
        if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && wy >= 0 && wy < 256) {
          chunk.setBlock(lx, wy, lz, block.type)
        }
      }
      return
    }
    // 第一步：清理结构范围内的水和不稳定方块，铺设地基
    const foundationDepth = 3 // 向下清理3层
    for (let dx = -1; dx <= this.width; dx++) {
      for (let dz = -1; dz <= this.depth; dz++) {
        const lx = originX + dx
        const lz = originZ + dz
        if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) continue

        // 清理地表到地基深度之间的方块（水、空气等）
        for (let dy = 0; dy > -foundationDepth; dy--) {
          const wy = originY + dy
          if (wy >= 0 && wy < 256) {
            const existingBlock = chunk.getBlock(lx, wy, lz)
            // 替换水和空气为固体地面
            if (existingBlock === BlockType.AIR || existingBlock === BlockType.WATER) {
              chunk.setBlock(lx, wy, lz, BlockType.DIRT)
            }
          }
        }

        // 在地基上方铺设一层草方块或泥土作为地面
        if (originY >= 0 && originY < 256) {
          const surfaceBlock = chunk.getBlock(lx, originY, lz)
          if (surfaceBlock === BlockType.AIR || surfaceBlock === BlockType.WATER) {
            chunk.setBlock(lx, originY, lz, BlockType.GRASS_BLOCK)
          }
        }
      }
    }

    // 第二步：清理结构范围内的空气（建筑内部空间）
    for (let dy = 1; dy <= this.height; dy++) {
      for (let dx = 0; dx < this.width; dx++) {
        for (let dz = 0; dz < this.depth; dz++) {
          const wy = originY + dy
          const lx = originX + dx
          const lz = originZ + dz
          if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) continue

          if (wy >= 0 && wy < 256) {
            const existingBlock = chunk.getBlock(lx, wy, lz)
            // 清除建筑空间内的水
            if (existingBlock === BlockType.WATER) {
              chunk.setBlock(lx, wy, lz, BlockType.AIR)
            }
          }
        }
      }
    }

    // 第三步：放置结构方块
    for (const block of this.blocks) {
      const wy = originY + block.y
      const lx = originX + block.x
      const lz = originZ + block.z

      if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && wy >= 0 && wy < 256) {
        chunk.setBlock(lx, wy, lz, block.type)
      }
    }
  }

  /**
   * 添加方块到结构
   */
  protected addBlock(x: number, y: number, z: number, type: BlockType): void {
    this.blocks.push({ x, y, z, type })
  }

  /**
   * 填充长方体区域
   */
  protected fillBox(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, type: BlockType): void {
    for (let y = y1; y <= y2; y++) {
      for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
          this.addBlock(x, y, z, type)
        }
      }
    }
  }

  /**
   * 填充空心长方体（只有壳）
   */
  protected hollowBox(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, type: BlockType): void {
    for (let y = y1; y <= y2; y++) {
      for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
          if (y === y1 || y === y2 || z === z1 || z === z2 || x === x1 || x === x2) {
            this.addBlock(x, y, z, type)
          }
        }
      }
    }
  }

  /**
   * 生成墙壁
   */
  protected walls(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, type: BlockType): void {
    for (let y = y1; y <= y2; y++) {
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        this.addBlock(x, y, z1, type)
        this.addBlock(x, y, z2, type)
      }
      for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
        this.addBlock(x1, y, z, type)
        this.addBlock(x2, y, z, type)
      }
    }
  }
}

/**
 * 村庄
 */
export class Village extends Structure {
  constructor() {
    super('village', 12, 7, 12)
    this.generate()
  }

  generate(): void {
    // Main house
    this.walls(0, 0, 0, 7, 5, 7, BlockType.OAK_PLANKS)
    this.fillBox(0, 5, 0, 7, 5, 7, BlockType.OAK_PLANKS) // Roof floor

    // Roof (triangular using stairs-like pattern)
    for (let i = 0; i < 4; i++) {
      this.fillBox(i, 6 + i, i, 7 - i, 6 + i, 7 - i, BlockType.OAK_LOG)
    }

    // Door opening
    for (let y = 0; y < 3; y++) {
      this.blocks = this.blocks.filter(b => !(b.x === 3 && b.z === 0 && b.y === y))
      this.blocks = this.blocks.filter(b => !(b.x === 4 && b.z === 0 && b.y === y))
    }

    // Windows
    for (let y = 2; y <= 3; y++) {
      this.addBlock(0, y, 3, BlockType.GLASS)
      this.addBlock(7, y, 3, BlockType.GLASS)
      this.addBlock(0, y, 4, BlockType.GLASS)
      this.addBlock(7, y, 4, BlockType.GLASS)
    }

    // Second smaller house
    this.walls(9, 0, 0, 11, 4, 5, BlockType.OAK_PLANKS)
    this.fillBox(9, 4, 0, 11, 4, 5, BlockType.OAK_PLANKS)
    for (let y = 0; y < 2; y++) {
      this.blocks = this.blocks.filter(b => !(b.x === 10 && b.z === 0 && b.y === y))
    }

    // Path
    for (let z = -2; z < 8; z++) {
      this.addBlock(8, 0, z, BlockType.COBBLESTONE)
    }

    // Well
    this.walls(4, 0, 9, 6, 2, 11, BlockType.COBBLESTONE)
    this.addBlock(5, 0, 10, BlockType.WATER)
  }
}

/**
 * 沙漠神殿
 */
export class DesertTemple extends Structure {
  constructor() {
    super('desert_temple', 15, 12, 15)
    this.generate()
  }

  generate(): void {
    // Base platform
    this.fillBox(0, 0, 0, 14, 0, 14, BlockType.SANDSTONE)

    // Walls
    this.walls(0, 1, 0, 14, 8, 14, BlockType.SANDSTONE)

    // Towers at corners
    for (const [cx, cz] of [[1, 1], [13, 1], [1, 13], [13, 13]]) {
      this.walls(cx - 1, 0, cz - 1, cx + 1, 10, cz + 1, BlockType.SANDSTONE)
      this.addBlock(cx, 11, cz, BlockType.ORANGE_TERRACOTTA)
    }

    // Center pyramid top
    for (let i = 0; i < 5; i++) {
      this.fillBox(4 + i, 9, 4 + i, 10 - i, 9, 10 - i, BlockType.SANDSTONE)
    }

    // Blue terracotta pattern on top
    this.fillBox(6, 9, 6, 8, 9, 8, BlockType.SAND)

    // Entrance
    for (let y = 1; y < 5; y++) {
      for (let x = 6; x <= 8; x++) {
        this.blocks = this.blocks.filter(b => !(b.x === x && b.z === 0 && b.y === y))
      }
    }

    // Interior
    this.fillBox(5, 1, 5, 9, 1, 9, BlockType.SAND)
  }
}

/**
 * 丛林神庙
 */
export class JungleTemple extends Structure {
  constructor() {
    super('jungle_temple', 12, 10, 12)
    this.generate()
  }

  generate(): void {
    // Main body
    this.fillBox(0, 0, 0, 11, 0, 11, BlockType.COBBLESTONE)
    this.walls(0, 1, 0, 11, 8, 11, BlockType.MOSSY_STONE_BRICKS)

    // Stepped pyramid top
    for (let i = 0; i < 3; i++) {
      this.fillBox(2 + i, 9, 2 + i, 9 - i, 9, 9 - i, BlockType.MOSSY_STONE_BRICKS)
    }

    // Stairs at front
    for (let i = 0; i < 5; i++) {
      this.fillBox(3, i, -i - 1, 8, i, -i - 1, BlockType.MOSSY_STONE_BRICKS)
    }

    // Entrance
    for (let y = 1; y < 4; y++) {
      for (let x = 4; x <= 7; x++) {
        this.blocks = this.blocks.filter(b => !(b.x === x && b.z === 0 && b.y === y))
      }
    }

    // Vine-covered decoration
    for (let y = 1; y < 8; y++) {
      if (Math.random() > 0.5) this.addBlock(0, y, Math.floor(Math.random() * 12), BlockType.OAK_LEAVES)
      if (Math.random() > 0.5) this.addBlock(11, y, Math.floor(Math.random() * 12), BlockType.OAK_LEAVES)
    }
  }
}

/**
 * 哨塔
 */
export class PillagerOutpost extends Structure {
  constructor() {
    super('pillager_outpost', 5, 18, 5)
    this.generate()
  }

  generate(): void {
    // Tower
    this.walls(0, 0, 0, 4, 16, 4, BlockType.COBBLESTONE)

    // Top platform
    this.fillBox(-1, 16, -1, 5, 16, 5, BlockType.OAK_PLANKS)

    // Roof
    this.fillBox(-1, 17, -1, 5, 17, 5, BlockType.OAK_PLANKS)

    // Windows
    for (let y = 4; y < 16; y += 4) {
      this.addBlock(0, y, 2, BlockType.AIR)
      this.addBlock(4, y, 2, BlockType.AIR)
      this.addBlock(2, y, 0, BlockType.AIR)
      this.addBlock(2, y, 4, BlockType.AIR)
    }

    // Entrance
    for (let y = 0; y < 3; y++) {
      this.blocks = this.blocks.filter(b => !(b.x === 2 && b.z === 0 && b.y === y))
    }

    // Fence around base
    for (let x = -3; x <= 7; x++) {
      this.addBlock(x, 1, -3, BlockType.OAK_PLANKS)
      this.addBlock(x, 1, 7, BlockType.OAK_PLANKS)
    }
    for (let z = -3; z <= 7; z++) {
      this.addBlock(-3, 1, z, BlockType.OAK_PLANKS)
      this.addBlock(7, 1, z, BlockType.OAK_PLANKS)
    }
  }
}

/**
 * 沉船
 */
export class Shipwreck extends Structure {
  constructor() {
    super('shipwreck', 8, 6, 16)
    this.generate()
  }

  generate(): void {
    // Hull (tilted, partially buried)
    for (let z = 0; z < 16; z++) {
      const yOff = Math.floor(Math.sin(z / 16 * Math.PI) * 3)
      const width = 3 - Math.abs(z - 8) / 5

      // Bottom
      for (let x = 4 - Math.floor(width); x <= 4 + Math.floor(width); x++) {
        this.addBlock(x, yOff, z, BlockType.OAK_PLANKS)
      }

      // Sides
      this.addBlock(4 - Math.floor(width), yOff + 1, z, BlockType.OAK_PLANKS)
      this.addBlock(4 + Math.floor(width), yOff + 1, z, BlockType.OAK_PLANKS)
      this.addBlock(4 - Math.floor(width), yOff + 2, z, BlockType.OAK_PLANKS)
      this.addBlock(4 + Math.floor(width), yOff + 2, z, BlockType.OAK_PLANKS)
    }

    // Mast
    for (let y = 0; y < 6; y++) {
      this.addBlock(4, y + 2, 8, BlockType.OAK_LOG)
    }

    // Deck
    this.fillBox(2, 3, 4, 6, 3, 12, BlockType.OAK_PLANKS)

    // Chest room
    this.walls(3, 1, 10, 5, 2, 13, BlockType.OAK_PLANKS)
    this.addBlock(4, 1, 11, BlockType.CHEST)
  }
}

/**
 * 海底神殿
 */
export class OceanMonument extends Structure {
  constructor() {
    super('ocean_monument', 24, 12, 24)
    this.generate()
  }

  generate(): void {
    // Central block
    this.fillBox(8, 0, 8, 15, 10, 15, BlockType.PRISMARINE || BlockType.STONE_BRICKS)

    // Wings
    this.fillBox(0, 0, 10, 7, 6, 13, BlockType.STONE_BRICKS)
    this.fillBox(16, 0, 10, 23, 6, 13, BlockType.STONE_BRICKS)
    this.fillBox(10, 0, 0, 13, 6, 7, BlockType.STONE_BRICKS)

    // Top pyramid
    for (let i = 0; i < 4; i++) {
      this.fillBox(9 + i, 11, 9 + i, 14 - i, 11, 14 - i, BlockType.STONE_BRICKS)
    }

    // Entrance pillars
    for (let y = 0; y < 8; y++) {
      this.addBlock(8, y, 7, BlockType.STONE_BRICKS)
      this.addBlock(15, y, 7, BlockType.STONE_BRICKS)
      this.addBlock(8, y, 16, BlockType.STONE_BRICKS)
      this.addBlock(15, y, 16, BlockType.STONE_BRICKS)
    }

    // Interior rooms (hollow)
    this.fillBox(9, 1, 9, 14, 9, 14, BlockType.WATER)
  }
}

/**
 * 下界堡垒
 */
export class NetherFortress extends Structure {
  constructor() {
    super('nether_fortress', 20, 12, 20)
    this.generate()
  }

  generate(): void {
    // Main corridor
    this.walls(0, 0, 8, 19, 5, 11, BlockType.NETHER_BRICKS)
    this.fillBox(0, 5, 8, 19, 5, 11, BlockType.NETHER_BRICKS) // Ceiling

    // Cross corridors
    this.walls(8, 0, 0, 11, 5, 19, BlockType.NETHER_BRICKS)
    this.fillBox(8, 5, 0, 11, 5, 19, BlockType.NETHER_BRICKS)

    // Towers at intersections
    for (const [cx, cz] of [[0, 8], [19, 8], [8, 0], [11, 0], [8, 19], [11, 19]]) {
      this.walls(cx - 1, 0, cz - 1, cx + 1, 8, cz + 1, BlockType.NETHER_BRICKS)
    }

    // Nether wart rooms
    this.fillBox(3, 0, 3, 6, 0, 6, BlockType.SOUL_SAND)
    this.fillBox(13, 0, 3, 16, 0, 6, BlockType.SOUL_SAND)

    // Open passages between corridors
    for (let y = 1; y < 4; y++) {
      for (let x = 1; x < 7; x++) {
        this.blocks = this.blocks.filter(b => !(b.x === x && b.z === 8 && b.y === y))
        this.blocks = this.blocks.filter(b => !(b.x === x && b.z === 11 && b.y === y))
      }
    }

    // Blaze spawner
    this.addBlock(9, 2, 9, BlockType.SPAWNER)
  }
}

/**
 * 猪灵堡垒
 */
export class BastionRemnant extends Structure {
  constructor() {
    super('bastion', 18, 10, 18)
    this.generate()
  }

  generate(): void {
    // Central courtyard
    this.walls(3, 0, 3, 14, 6, 14, BlockType.BLACKSTONE)
    this.fillBox(3, 0, 3, 14, 0, 14, BlockType.BLACKSTONE)

    // Corner towers
    for (const [cx, cz] of [[0, 0], [17, 0], [0, 17], [17, 17]]) {
      this.walls(cx, 0, cz, cx + 3, 9, cz + 3, BlockType.BLACKSTONE)
    }

    // Bridge connections
    this.fillBox(3, 3, 8, 5, 3, 10, BlockType.BASALT)
    this.fillBox(12, 3, 8, 14, 3, 10, BlockType.BASALT)

    // Gold blocks (treasure)
    this.addBlock(8, 1, 8, BlockType.GOLD_BLOCK)
    this.addBlock(9, 1, 8, BlockType.GOLD_BLOCK)
    this.addBlock(8, 1, 9, BlockType.GOLD_BLOCK)

    // Interior (hollow)
    this.fillBox(4, 1, 4, 13, 5, 13, BlockType.AIR)
    this.addBlock(8, 0, 8, BlockType.SOUL_SAND)
    this.addBlock(9, 0, 9, BlockType.SOUL_SAND)
  }
}

/**
 * 末地船
 */
export class EndShip extends Structure {
  constructor() {
    super('end_ship', 6, 8, 18)
    this.generate()
  }

  generate(): void {
    // Hull
    for (let z = 0; z < 18; z++) {
      const width = Math.max(1, 3 - Math.abs(z - 9) / 4)
      for (let x = 3 - Math.floor(width); x <= 3 + Math.floor(width); x++) {
        this.addBlock(x, 0, z, BlockType.END_STONE)
        this.addBlock(x, 1, z, BlockType.PURPUR_BLOCK)
      }
    }

    // Deck
    this.fillBox(1, 2, 3, 5, 2, 15, BlockType.PURPUR_BLOCK)

    // Mast
    for (let y = 2; y < 8; y++) {
      this.addBlock(3, y, 9, BlockType.PURPUR_BLOCK)
    }

    // Dragon head at bow
    this.addBlock(3, 3, 17, BlockType.OBSIDIAN)
    this.addBlock(3, 4, 17, BlockType.OBSIDIAN)

    // Wings/sails
    for (let y = 3; y < 7; y++) {
      this.addBlock(1, y, 9, BlockType.PURPUR_BLOCK)
      this.addBlock(5, y, 9, BlockType.PURPUR_BLOCK)
    }

    // Treasure room
    this.walls(2, 3, 5, 4, 5, 7, BlockType.PURPUR_BLOCK)
    this.addBlock(3, 3, 6, BlockType.OBSIDIAN)
    this.addBlock(3, 3, 6, BlockType.CHEST)
  }
}

/**
 * 灵魂沙峡谷装饰
 */
export class SoulSandValley extends Structure {
  constructor() {
    super('soul_sand_valley', 16, 8, 16)
    this.generate()
  }

  generate(): void {
    // Soul sand ground
    this.fillBox(0, 0, 0, 15, 1, 15, BlockType.SOUL_SAND)
    this.fillBox(0, 0, 0, 15, 0, 15, BlockType.SOUL_SOIL)

    // Basalt pillars
    for (let i = 0; i < 4; i++) {
      const px = 3 + Math.floor(Math.random() * 10)
      const pz = 3 + Math.floor(Math.random() * 10)
      const h = 4 + Math.floor(Math.random() * 4)
      for (let y = 0; y < h; y++) {
        this.addBlock(px, y, pz, BlockType.BASALT)
      }
    }

    // Bones/fossils
    for (let i = 0; i < 6; i++) {
      this.addBlock(
        Math.floor(Math.random() * 16),
        2,
        Math.floor(Math.random() * 16),
        BlockType.GLOWSTONE
      )
    }
  }
}

/**
 * 诡异森林装饰
 */
export class WarpedForest extends Structure {
  constructor() {
    super('warped_forest', 16, 16, 16)
    this.generate()
  }

  generate(): void {
    // Ground
    this.fillBox(0, 0, 0, 15, 0, 15, BlockType.WARPED_NYLIUM)

    // Warped trees (tall stems with foliage)
    for (let i = 0; i < 8; i++) {
      const tx = 2 + Math.floor(Math.random() * 12)
      const tz = 2 + Math.floor(Math.random() * 12)
      const h = 8 + Math.floor(Math.random() * 8)

      // Stem
      for (let y = 1; y <= h; y++) {
        this.addBlock(tx, y, tz, BlockType.OAK_LOG) // Using oak as warped stem substitute
      }

      // Foliage top
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (Math.abs(dx) + Math.abs(dz) < 4) {
            this.addBlock(tx + dx, h + 1, tz + dz, BlockType.OAK_LEAVES)
            if (Math.random() > 0.3) {
              this.addBlock(tx + dx, h + 2, tz + dz, BlockType.OAK_LEAVES)
            }
          }
        }
      }
    }

    // Shroomlight equivalents
    for (let i = 0; i < 3; i++) {
      this.addBlock(
        Math.floor(Math.random() * 16),
        3 + Math.floor(Math.random() * 5),
        Math.floor(Math.random() * 16),
        BlockType.GLOWSTONE
      )
    }
  }
}

/**
 * StructureRegistry - 建筑物注册表
 */
export class AncientCity extends Structure {
  constructor() {
    super('ancient_city', 16, 8, 16)
    this.generate()
  }

  generate(): void {
    this.fillBox(0, 0, 0, 15, 0, 15, BlockType.DEEPSLATE)
    for (let x = 0; x < 16; x += 5) this.fillBox(x, 1, 0, x + 1, 1, 15, BlockType.BLUE_WOOL)
    for (let z = 0; z < 16; z += 5) this.fillBox(0, 1, z, 15, 1, z + 1, BlockType.CYAN_WOOL)
    for (const [x, z] of [[1, 1], [13, 1], [1, 13], [13, 13]]) {
      this.fillBox(x, 1, z, x + 1, 6, z + 1, BlockType.DEEPSLATE)
      this.addBlock(x, 7, z, BlockType.SOUL_LANTERN)
    }
    this.hollowBox(5, 1, 5, 10, 6, 10, BlockType.DEEPSLATE)
    this.fillBox(7, 1, 5, 8, 3, 5, BlockType.AIR)
    this.addBlock(7, 2, 8, BlockType.CHEST)
    this.addBlock(8, 2, 8, BlockType.SPAWNER)
  }
}

export class Stronghold extends Structure {
  constructor() {
    super('stronghold', 16, 9, 16)
    this.generate()
  }

  generate(): void {
    this.hollowBox(0, 0, 0, 15, 6, 15, BlockType.STONE_BRICKS)
    this.fillBox(1, 0, 1, 14, 0, 14, BlockType.MOSSY_STONE_BRICKS)
    this.walls(1, 1, 6, 14, 5, 9, BlockType.MOSSY_STONE_BRICKS)
    this.fillBox(6, 1, 1, 9, 5, 14, BlockType.AIR)
    this.fillBox(4, 1, 10, 11, 1, 14, BlockType.END_STONE)
    for (let x = 5; x <= 10; x++) {
      this.addBlock(x, 2, 11, BlockType.OBSIDIAN)
      this.addBlock(x, 2, 14, BlockType.OBSIDIAN)
    }
    this.addBlock(3, 1, 3, BlockType.CHEST)
    this.addBlock(12, 1, 12, BlockType.SPAWNER)
    this.addBlock(7, 3, 8, BlockType.TORCH)
  }
}

export const STRUCTURE_REGISTRY: Record<string, new () => Structure> = {
  village: Village,
  desert_temple: DesertTemple,
  jungle_temple: JungleTemple,
  pillager_outpost: PillagerOutpost,
  shipwreck: Shipwreck,
  ocean_monument: OceanMonument,
  nether_fortress: NetherFortress,
  bastion: BastionRemnant,
  end_ship: EndShip,
  soul_sand_valley: SoulSandValley,
  warped_forest: WarpedForest,
  ancient_city: AncientCity,
  stronghold: Stronghold,
}
