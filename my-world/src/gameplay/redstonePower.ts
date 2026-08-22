/**
 * 红石粉尘能量共享注册表。
 * RedstoneSystem 每 tick 写入, ChunkMesher 在重建网格时读取,
 * 用于让粉尘按能量等级点亮 (0=暗红, 15=最亮)。
 * 独立模块避免 RedstoneSystem ↔ ChunkMesher 循环依赖。
 */
export const dustPowerRegistry = new Map<string, number>()

export const dustPowerKey = (x: number, y: number, z: number): string => `${x},${y},${z}`

export function getDustPower(x: number, y: number, z: number): number {
  return dustPowerRegistry.get(dustPowerKey(x, y, z)) ?? 0
}
