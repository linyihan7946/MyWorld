export enum BlockType {
  AIR = 0,
  DIRT = 1,
  STONE = 2,
  BEDROCK = 3,
  ORE = 4,
  WOOD = 5,
  GRASS = 6,
}

export interface BlockProperty {
  visible: boolean;
  breakable: boolean;
  color?: number;
}

export const BlockProperties: Record<BlockType, BlockProperty> = {
  [BlockType.AIR]: { visible: false, breakable: false },
  [BlockType.DIRT]: { visible: true, breakable: true, color: 0x8B4513 },
  [BlockType.STONE]: { visible: true, breakable: true, color: 0x808080 },
  [BlockType.BEDROCK]: { visible: true, breakable: false, color: 0x222222 },
  [BlockType.ORE]: { visible: true, breakable: true, color: 0xFFD700 },
  [BlockType.WOOD]: { visible: true, breakable: true, color: 0xA0522D },
  [BlockType.GRASS]: { visible: true, breakable: true, color: 0x228B22 },
};
