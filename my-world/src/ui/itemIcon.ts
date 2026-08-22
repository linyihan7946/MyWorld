import type { CSSProperties } from 'vue'
import { ATLAS_SIZE } from '@/utils/constants'
import { BlockType, getBlockDefinition, getBlockTypeForItem } from '@/types/blocks'
import { getItemIconDataUrl as _getItemIconDataUrl } from '@/ui/itemTextures'

// 官方 Wiki (minecraft.wiki) 下载的原版图标, 由 scripts/download-item-icons.mjs 生成
// key: 物品 id, value: 打包后的图片 URL
const officialIconModules = import.meta.glob('../assets/item-icons/*.png', { eager: true }) as Record<
  string,
  { default: string }
>
const OFFICIAL_ICONS: Record<string, string> = {}
for (const [path, mod] of Object.entries(officialIconModules)) {
  const fileName = path.split('/').pop() ?? ''
  OFFICIAL_ICONS[fileName.replace(/\.png$/, '')] = mod.default
}

export function hasOfficialIcon(itemId: string): boolean {
  return itemId in OFFICIAL_ICONS
}

export function getOfficialIconUrl(itemId: string): string | null {
  return OFFICIAL_ICONS[itemId] ?? null
}

export function getBlockIconStyle(blockType?: BlockType): CSSProperties {
  if (blockType === undefined || blockType === BlockType.AIR) return {}

  const textures = getBlockDefinition(blockType).textures
  const textureIndex = textures.top ?? textures.all ?? textures.side ?? textures.bottom
  if (textureIndex === undefined) return {}

  const col = textureIndex % ATLAS_SIZE
  const row = Math.floor(textureIndex / ATLAS_SIZE)
  const denominator = Math.max(1, ATLAS_SIZE - 1)

  return {
    backgroundImage: 'var(--block-texture-atlas)',
    backgroundSize: `${ATLAS_SIZE * 100}% ${ATLAS_SIZE * 100}%`,
    backgroundPosition: `${(col / denominator) * 100}% ${(row / denominator) * 100}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  }
}

export function getItemIconDataUrl(itemId: string): string | null {
  return _getItemIconDataUrl(itemId)
}

export function getItemIconStyle(itemId: string | null, explicitBlockType?: BlockType): CSSProperties {
  // 1. 官方 Wiki 原版图标优先 (物品与方块通用)
  if (itemId && OFFICIAL_ICONS[itemId]) {
    return {
      backgroundImage: `url("${OFFICIAL_ICONS[itemId]}")`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
    }
  }
  const blockType = explicitBlockType ?? getBlockTypeForItem(itemId)
  // 2. Block items use the texture atlas
  if (blockType !== undefined && blockType !== BlockType.AIR) {
    return getBlockIconStyle(blockType)
  }
  // 3. Non-block items: use procedurally generated pixel-art icons
  if (itemId) {
    let dataUrl: string | null = null
    try {
      dataUrl = _getItemIconDataUrl(itemId)
    } catch (error) {
      // One malformed procedural texture must not prevent an entire creative
      // category (such as Tools or Combat) from opening.
      console.warn(`Failed to render inventory icon for ${itemId}`, error)
    }
    if (dataUrl) {
      return {
        backgroundImage: `url("${dataUrl}")`,
        backgroundSize: '100% 100%',
        imageRendering: 'pixelated',
      }
    }
  }
  return {}
}
