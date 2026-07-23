import type { CSSProperties } from 'vue'
import { ATLAS_SIZE } from '@/utils/constants'
import { BlockType, getBlockDefinition, getBlockTypeForItem } from '@/types/blocks'
import { getItemIconDataUrl as _getItemIconDataUrl } from '@/ui/itemTextures'

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
  const blockType = explicitBlockType ?? getBlockTypeForItem(itemId)
  // Block items use the texture atlas
  if (blockType !== undefined && blockType !== BlockType.AIR) {
    return getBlockIconStyle(blockType)
  }
  // Non-block items: use procedurally generated pixel-art icons
  if (itemId) {
    const dataUrl = _getItemIconDataUrl(itemId)
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
