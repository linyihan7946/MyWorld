/**
 * BlockStateSystem - 方块状态系统
 * 调试棒翻转方块朝向/属性
 */
import { BlockType, BLOCK_REGISTRY } from '@/types/blocks'

// 方块朝向: 0=north, 1=south, 2=east, 3=west, 4=up, 5=down
export type Facing = 0 | 1 | 2 | 3 | 4 | 5

export const FACING_NAMES: Record<Facing, string> = {
  0: '北(north)',
  1: '南(south)',
  2: '东(east)',
  3: '西(west)',
  4: '上(up)',
  5: '下(down)',
}

// 方块状态
export interface BlockState {
  facing?: Facing
  conditional?: boolean       // 命令方块: 条件/无条件
  alwaysOn?: boolean          // 命令方块: 保持开启/需要红石
  command?: string            // 命令方块的命令
  mode?: 'save' | 'load' | 'corner' | 'data'  // 结构方块模式
  lightLevel?: number         // 光源方块亮度 (0-15)
  lightOn?: boolean           // 光源方块开关
  axis?: 'x' | 'y' | 'z'    // 木头轴向
  half?: 'top' | 'bottom'    // 台阶/门等
  open?: boolean              // 门/活板门
  powered?: boolean           // 按钮/拉杆
  structureName?: string      // 结构方块保存的结构名称
  tntFuse?: number            // TNT 引信剩余时间
}

// 存储所有方块状态
const blockStates = new Map<string, BlockState>()

function posKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`
}

export function getBlockState(x: number, y: number, z: number): BlockState {
  return blockStates.get(posKey(x, y, z)) || {}
}

export function setBlockState(x: number, y: number, z: number, state: BlockState): void {
  const key = posKey(x, y, z)
  const current = blockStates.get(key) || {}
  blockStates.set(key, { ...current, ...state })
}

export function removeBlockState(x: number, y: number, z: number): void {
  blockStates.delete(posKey(x, y, z))
}

export function getBlockStateValue<T extends keyof BlockState>(
  x: number, y: number, z: number, key: T, defaultVal: BlockState[T]
): BlockState[T] {
  const state = blockStates.get(posKey(x, y, z))
  return state?.[key] ?? defaultVal
}

// ============================================================
// 调试棒 - 可调试的方块属性
// ============================================================

interface DebuggableProp {
  name: string
  key: keyof BlockState
  values: BlockState[keyof BlockState][]
}

// 每种方块可以被调试的属性
const DEBUGGABLE_PROPS: Partial<Record<BlockType, DebuggableProp[]>> = {
  [BlockType.COMMAND_BLOCK]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3, 4, 5] as Facing[] },
    { name: '条件', key: 'conditional', values: [false, true] },
    { name: '保持开启', key: 'alwaysOn', values: [false, true] },
  ],
  [BlockType.CHAIN_COMMAND_BLOCK]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3, 4, 5] as Facing[] },
    { name: '条件', key: 'conditional', values: [false, true] },
    { name: '保持开启', key: 'alwaysOn', values: [false, true] },
  ],
  [BlockType.REPEAT_COMMAND_BLOCK]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3, 4, 5] as Facing[] },
    { name: '条件', key: 'conditional', values: [false, true] },
    { name: '保持开启', key: 'alwaysOn', values: [false, true] },
  ],
  [BlockType.STRUCTURE_BLOCK]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
    { name: '模式', key: 'mode', values: ['save', 'load', 'corner', 'data'] },
  ],
  [BlockType.LIGHT_BLOCK]: [
    { name: '亮度', key: 'lightLevel', values: Array.from({ length: 16 }, (_, i) => i) },
  ],
  [BlockType.OAK_LOG]: [
    { name: '轴向', key: 'axis', values: ['x', 'y', 'z'] },
  ],
  [BlockType.SPRUCE_LOG]: [
    { name: '轴向', key: 'axis', values: ['x', 'y', 'z'] },
  ],
  [BlockType.BIRCH_LOG]: [
    { name: '轴向', key: 'axis', values: ['x', 'y', 'z'] },
  ],
  [BlockType.JUNGLE_LOG]: [
    { name: '轴向', key: 'axis', values: ['x', 'y', 'z'] },
  ],
  [BlockType.ACACIA_LOG]: [
    { name: '轴向', key: 'axis', values: ['x', 'y', 'z'] },
  ],
  [BlockType.DARK_OAK_LOG]: [
    { name: '轴向', key: 'axis', values: ['x', 'y', 'z'] },
  ],
  [BlockType.OAK_DOOR]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
    { name: '开/关', key: 'open', values: [false, true] },
    { name: '上/下', key: 'half', values: ['top', 'bottom'] },
  ],
  [BlockType.SPRUCE_DOOR]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
    { name: '开/关', key: 'open', values: [false, true] },
  ],
  [BlockType.BIRCH_DOOR]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
    { name: '开/关', key: 'open', values: [false, true] },
  ],
  [BlockType.OAK_TRAPDOOR]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
    { name: '开/关', key: 'open', values: [false, true] },
    { name: '上/下', key: 'half', values: ['top', 'bottom'] },
  ],
  [BlockType.SPRUCE_TRAPDOOR]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
    { name: '开/关', key: 'open', values: [false, true] },
  ],
  [BlockType.OAK_BUTTON]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
  ],
  [BlockType.STONE_BUTTON]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
  ],
  [BlockType.PISTON]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3, 4, 5] as Facing[] },
  ],
  [BlockType.STICKY_PISTON]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3, 4, 5] as Facing[] },
  ],
  [BlockType.OBSERVER]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3, 4, 5] as Facing[] },
  ],
  // 床可以被调试(翻转朝向)
  [BlockType.WHITE_BED]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
  ],
  [BlockType.RED_BED]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
  ],
  [BlockType.BLUE_BED]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
  ],
  [BlockType.GREEN_BED]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
  ],
  [BlockType.YELLOW_BED]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
  ],
  [BlockType.PURPLE_BED]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
  ],
  [BlockType.CYAN_BED]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
  ],
  // 台阶
  [BlockType.STONE_SLAB]: [
    { name: '位置', key: 'half', values: ['top', 'bottom'] },
  ],
  [BlockType.COBBLESTONE_SLAB]: [
    { name: '位置', key: 'half', values: ['top', 'bottom'] },
  ],
  // 楼梯
  [BlockType.COBBLESTONE_STAIRS]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
    { name: '上/下', key: 'half', values: ['top', 'bottom'] },
  ],
  [BlockType.STONE_BRICK_STAIRS]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
    { name: '上/下', key: 'half', values: ['top', 'bottom'] },
  ],
  [BlockType.OAK_STAIRS]: [
    { name: '朝向', key: 'facing', values: [0, 1, 2, 3] as Facing[] },
    { name: '上/下', key: 'half', values: ['top', 'bottom'] },
  ],
}

// 当前正在调试的方块索引
const debugPropIndex = new Map<string, number>()

/**
 * 调试棒交互：循环切换方块的属性
 * 返回: { propName, newValue, message } | null (不可调试)
 */
export function debugStickUse(
  x: number, y: number, z: number, blockType: BlockType
): { propName: string; newValue: string | number | boolean; message: string } | null {
  const props = DEBUGGABLE_PROPS[blockType]
  if (!props || props.length === 0) return null

  const key = posKey(x, y, z)
  let idx = debugPropIndex.get(key) || 0
  if (idx >= props.length) idx = 0

  const prop = props[idx]
  const state = getBlockState(x, y, z)
  const currentValue = state[prop.key]

  // 找到当前值的索引，循环到下一个
  const valueIdx = prop.values.indexOf(currentValue as any)
  const nextValueIdx = (valueIdx + 1) % prop.values.length
  const nextValue = prop.values[nextValueIdx]

  // 设置新状态
  setBlockState(x, y, z, { [prop.key]: nextValue } as BlockState)

  // 如果是最后一个值，切换到下一个属性
  if (nextValueIdx === prop.values.length - 1) {
    debugPropIndex.set(key, (idx + 1) % props.length)
  }

  const valueStr = typeof nextValue === 'boolean'
    ? (nextValue ? '是' : '否')
    : typeof nextValue === 'number' && prop.key === 'facing'
      ? FACING_NAMES[nextValue as Facing]
      : String(nextValue)

  return {
    propName: prop.name,
    newValue: nextValue as string | number | boolean,
    message: `${prop.name} → ${valueStr}`,
  }
}

/**
 * 检查一个方块是否可以被调试棒调试
 */
export function isDebuggable(blockType: BlockType): boolean {
  const props = DEBUGGABLE_PROPS[blockType]
  return props !== undefined && props.length > 0
}

// ============================================================
// 光源方块交互
// ============================================================

/**
 * 切换光源方块开关
 */
export function toggleLightBlock(x: number, y: number, z: number): boolean {
  const state = getBlockState(x, y, z)
  const isOn = state.lightOn !== false // 默认开启
  setBlockState(x, y, z, { lightOn: !isOn })
  return !isOn
}

/**
 * 获取光源方块当前亮度
 */
export function getLightLevel(x: number, y: number, z: number): number {
  const state = getBlockState(x, y, z)
  if (state.lightOn === false) return 0
  return state.lightLevel ?? 15
}

// ============================================================
// 命令方块交互
// ============================================================

/**
 * 获取命令方块的命令
 */
export function getCommand(x: number, y: number, z: number): string {
  return getBlockStateValue(x, y, z, 'command', '') as string
}

/**
 * 设置命令方块的命令
 */
export function setCommand(x: number, y: number, z: number, command: string): void {
  setBlockState(x, y, z, { command })
}

/**
 * 获取命令方块是否保持开启
 */
export function isCommandAlwaysOn(x: number, y: number, z: number): boolean {
  return getBlockStateValue(x, y, z, 'alwaysOn', false) as boolean
}

/**
 * 获取命令方块是否是条件模式
 */
export function isCommandConditional(x: number, y: number, z: number): boolean {
  return getBlockStateValue(x, y, z, 'conditional', false) as boolean
}

/**
 * 简单命令执行器 (模拟命令执行)
 */
export function executeCommand(command: string): { success: boolean; message: string } {
  if (!command || !command.startsWith('/')) {
    return { success: false, message: '命令必须以 / 开头' }
  }

  const parts = command.substring(1).split(/\s+/)
  const cmd = parts[0].toLowerCase()

  const knownCommands: Record<string, string> = {
    say: '💬 消息已发送',
    give: '🎁 物品已给予',
    tp: '🚀 已传送',
    teleport: '🚀 已传送',
    time: '⏰ 时间已设置',
    weather: '🌤️ 天气已设置',
    gamemode: '🎮 模式已切换',
    kill: '💀 目标已清除',
    effect: '✨ 效果已应用',
    setblock: '🧱 方块已放置',
    fill: '🏗️ 区域已填充',
    summon: '🐣 实体已召唤',
    clear: '🗑️ 物品栏已清空',
    difficulty: '🎯 难度已设置',
    gamerule: '⚙️ 规则已设置',
    title: '📺 标题已显示',
    enchant: '✨ 已附魔',
    playsound: '🔊 音效已播放',
    clone: '📋 区域已克隆',
    execute: '⚡ 命令已执行',
    worldborder: '🌍 边界已设置',
    xp: '⭐ 经验已给予',
  }

  if (knownCommands[cmd]) {
    return { success: true, message: knownCommands[cmd] }
  }

  return { success: false, message: `未知命令: ${cmd}` }
}

// ============================================================
// 开发调试: 暴露方块状态模块供自动化测试使用
// ============================================================
if (import.meta.env.DEV) {
  ;(window as any).__blockStateSystem = {
    getBlockState, getBlockStateValue, setBlockState, removeBlockState,
    getLightLevel, toggleLightBlock, getCommand, setCommand,
  }
}
