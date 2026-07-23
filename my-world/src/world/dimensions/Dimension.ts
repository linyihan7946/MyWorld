import * as THREE from 'three'

/**
 * Dimension - 维度基类
 */
export abstract class Dimension {
  public name: string
  public skyColor: THREE.Color
  public fogColor: THREE.Color
  public fogNear: number
  public fogFar: number
  public hasSky: boolean
  public hasCeiling: boolean
  public ambientLight: number

  constructor(
    name: string,
    skyColor: number,
    fogColor: number,
    fogNear: number,
    fogFar: number,
    hasSky: boolean,
    hasCeiling: boolean,
    ambientLight: number,
  ) {
    this.name = name
    this.skyColor = new THREE.Color(skyColor)
    this.fogColor = new THREE.Color(fogColor)
    this.fogNear = fogNear
    this.fogFar = fogFar
    this.hasSky = hasSky
    this.hasCeiling = hasCeiling
    this.ambientLight = ambientLight
  }

  abstract getDefaultSpawnHeight(): number
  abstract getTerrainHeight(worldX: number, worldZ: number): number
}

/**
 * OverworldDimension - 主世界
 */
export class OverworldDimension extends Dimension {
  constructor() {
    super(
      'overworld',
      0x87CEEB, // Sky blue
      0x87CEEB, // Fog = sky color
      60,  // fogNear
      128, // fogFar
      true, // hasSky
      false, // no ceiling
      0.5, // ambientLight
    )
  }

  getDefaultSpawnHeight(): number {
    return 70
  }

  getTerrainHeight(_worldX: number, _worldZ: number): number {
    return 64 // Default, actual height from WorldGenerator
  }
}

/**
 * NetherDimension - 下界
 */
export class NetherDimension extends Dimension {
  constructor() {
    super(
      'nether',
      0x330808, // Dark red sky
      0x330808,
      10,  // Close fog
      60,
      false, // No normal sky
      true,  // Has ceiling (bedrock)
      0.3,
    )
  }

  getDefaultSpawnHeight(): number {
    return 64
  }

  getTerrainHeight(_worldX: number, _worldZ: number): number {
    return 32
  }
}

/**
 * EndDimension - 末地
 */
export class EndDimension extends Dimension {
  constructor() {
    super(
      'end',
      0x000000, // Black sky
      0x0A0A1A,
      40,
      100,
      false, // Void sky
      false, // No ceiling
      0.4,
    )
  }

  getDefaultSpawnHeight(): number {
    return 64
  }

  getTerrainHeight(_worldX: number, _worldZ: number): number {
    return 56
  }
}

/**
 * DimensionRegistry
 */
export const DIMENSIONS = {
  overworld: new OverworldDimension(),
  nether: new NetherDimension(),
  end: new EndDimension(),
}
