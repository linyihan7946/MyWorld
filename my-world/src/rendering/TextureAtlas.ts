import * as THREE from 'three'
import { ATLAS_SIZE, TEXTURE_RESOLUTION } from '@/utils/constants'
import { BlockType, BLOCK_REGISTRY } from '@/types/blocks'

/**
 * TextureAtlas - 纹理图集
 * 将所有方块纹理打包到一张大纹理中（32×32 像素/格）
 */
export class TextureAtlas {
  public texture: THREE.Texture
  public readonly atlasSize = ATLAS_SIZE
  public readonly texResolution = TEXTURE_RESOLUTION

  constructor() {
    const canvas = document.createElement('canvas')
    canvas.width = ATLAS_SIZE * TEXTURE_RESOLUTION
    canvas.height = ATLAS_SIZE * TEXTURE_RESOLUTION
    const ctx = canvas.getContext('2d')!

    this.generateTextures(ctx)

    document.documentElement.style.setProperty(
      '--block-texture-atlas',
      `url("${canvas.toDataURL('image/png')}")`,
    )

    this.texture = new THREE.CanvasTexture(canvas)
    this.texture.magFilter = THREE.NearestFilter
    this.texture.minFilter = THREE.NearestFilter
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.needsUpdate = true
  }

  getUV(texIndex: number): { u: number; v: number; uSize: number; vSize: number } {
    const col = texIndex % ATLAS_SIZE
    const row = Math.floor(texIndex / ATLAS_SIZE)
    return {
      u: col / ATLAS_SIZE,
      v: 1 - (row + 1) / ATLAS_SIZE,
      uSize: 1 / ATLAS_SIZE,
      vSize: 1 / ATLAS_SIZE,
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 工具函数
  // ──────────────────────────────────────────────────────────────

  /** 确定性哈希 [0,1) */
  private static h(x: number, y: number, seed = 0): number {
    let h = (x * 374761393 + y * 668265263 + seed * 982451653) | 0
    h = ((h ^ (h >>> 13)) * 1274126177) | 0
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }

  /** 在区域上逐像素绘制基于 RGB 基色的噪声 */
  private static noiseFill(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    r: number, g: number, b: number,
    variance: number,
    density = 1, seed = 0,
  ) {
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        if (TextureAtlas.h(px, py, seed) < density) {
          const n = (TextureAtlas.h(px + 177, py + 311, seed + 7) - 0.5) * variance
          const cr = Math.max(0, Math.min(255, Math.round(r + n)))
          const cg = Math.max(0, Math.min(255, Math.round(g + n)))
          const cb = Math.max(0, Math.min(255, Math.round(b + n)))
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`
          ctx.fillRect(x + px, y + py, 1, 1)
        }
      }
    }
  }

  /** 多色像素噪声 */
  private static multiNoise(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    colors: string[], density: number, seed = 0,
  ) {
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        if (TextureAtlas.h(px, py, seed) < density) {
          ctx.fillStyle = colors[Math.floor(TextureAtlas.h(px, py, seed + 77) * colors.length)]
          ctx.fillRect(x + px, y + py, 1, 1)
        }
      }
    }
  }

  /** 简单纯色填充 */
  private static fill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(x, y, w, h)
  }

  // ──────────────────────────────────────────────────────────────
  // 纹理生成
  // ──────────────────────────────────────────────────────────────

  private generateTextures(ctx: CanvasRenderingContext2D): void {
    const S = TEXTURE_RESOLUTION
    const H = TextureAtlas.h
    const NF = TextureAtlas.noiseFill
    const MN = TextureAtlas.multiNoise
    const F = TextureAtlas.fill

    const draw = (index: number, fn: (x: number, y: number, s: number) => void) => {
      const col = index % ATLAS_SIZE
      const row = Math.floor(index / ATLAS_SIZE)
      ctx.save()
      ctx.translate(col * S, row * S)
      fn(0, 0, S)
      ctx.restore()
    }

    // 0: AIR（不绘制）

    // ── 1: 石头 ──
    draw(1, (x, y, s) => {
      F(ctx, x, y, s, s, '#7e7e7e')
      NF(ctx, x, y, s, s, 126, 126, 126, 50, 1, 1)
      // 裂纹
      for (let i = 0; i < 4; i++) {
        const sx = x + Math.floor(H(i, 0, 10) * s)
        const sy = y + Math.floor(H(0, i, 10) * s)
        const len = 3 + Math.floor(H(i, i, 10) * 5)
        F(ctx, sx, sy, 1, len, `rgba(60,60,60,0.5)`)
        F(ctx, sx, sy + len, 2, 1, `rgba(60,60,60,0.4)`)
      }
      // 高光点
      for (let i = 0; i < 8; i++) {
        F(ctx, x + Math.floor(H(i, 5, 20) * s), y + Math.floor(H(5, i, 20) * s), 1, 1, 'rgba(160,160,160,0.5)')
      }
    })

    // ── 2: 泥土 ──
    draw(2, (x, y, s) => {
      F(ctx, x, y, s, s, '#8b5a2b')
      NF(ctx, x, y, s, s, 139, 90, 43, 45, 1, 2)
      // 小石子
      for (let i = 0; i < 5; i++) {
        const px = x + Math.floor(H(i, 3, 30) * (s - 2))
        const py = y + Math.floor(H(3, i, 30) * (s - 2))
        F(ctx, px, py, 2, 1, '#6b4420')
      }
      // 暗斑
      for (let i = 0; i < 6; i++) {
        F(ctx, x + Math.floor(H(i, 7, 40) * s), y + Math.floor(H(7, i, 40) * s), 1, 1, 'rgba(80,45,15,0.5)')
      }
    })

    // ── 3: 草方块顶部 ──
    draw(3, (x, y, s) => {
      F(ctx, x, y, s, s, '#5d9b37')
      NF(ctx, x, y, s, s, 93, 155, 55, 55, 1, 3)
      // 亮色草叶
      for (let i = 0; i < 24; i++) {
        const px = x + Math.floor(H(i, 0, 50) * s)
        const py = y + Math.floor(H(0, i, 50) * s)
        F(ctx, px, py, 1, 1, '#7bc050')
      }
      // 暗色阴影
      for (let i = 0; i < 16; i++) {
        const px = x + Math.floor(H(i, 3, 55) * s)
        const py = y + Math.floor(H(3, i, 55) * s)
        F(ctx, px, py, 1, 1, '#3d7b17')
      }
    })

    // ── 4: 草方块侧面 ──
    draw(4, (x, y, s) => {
      // 上部绿色（不规则边缘）
      F(ctx, x, y, s, 5, '#5d9b37')
      for (let px = 0; px < s; px++) {
        const extraH = 2 + Math.floor(H(px, 0, 60) * 4)
        F(ctx, x + px, y, 1, 3 + extraH, '#5d9b37')
        // 绿色过渡到泥土的像素
        if (H(px, 1, 61) > 0.5) {
          F(ctx, x + px, y + 3 + extraH, 1, 1, '#6a8a30')
        }
      }
      NF(ctx, x, y, s, 4, 93, 155, 55, 40, 0.8, 62)
      // 下部泥土
      F(ctx, x, y + 5, s, s - 5, '#8b5a2b')
      NF(ctx, x, y + 5, s, s - 5, 139, 90, 43, 40, 1, 63)
      for (let i = 0; i < 4; i++) {
        const px = x + Math.floor(H(i, 9, 64) * (s - 2))
        const py = y + 7 + Math.floor(H(9, i, 64) * (s - 9))
        F(ctx, px, py, 2, 1, '#6b4420')
      }
    })

    // ── 5: 基岩 ──
    draw(5, (x, y, s) => {
      F(ctx, x, y, s, s, '#3a3a3a')
      NF(ctx, x, y, s, s, 58, 58, 58, 40, 1, 5)
      for (let i = 0; i < 6; i++) {
        const px = x + Math.floor(H(i, 2, 70) * s)
        const py = y + Math.floor(H(2, i, 70) * s)
        F(ctx, px, py, 2, 2, '#252525')
      }
    })

    // ── 6: 圆石 ──
    draw(6, (x, y, s) => {
      F(ctx, x, y, s, s, '#7a7a7a')
      // 石块轮廓
      const stones = [
        { px: 0, py: 0, w: 10, h: 8 }, { px: 10, py: 0, w: 12, h: 10 },
        { px: 22, py: 0, w: 10, h: 8 }, { px: 0, py: 8, w: 8, h: 10 },
        { px: 8, py: 10, w: 12, h: 8 }, { px: 20, py: 8, w: 12, h: 12 },
        { px: 0, py: 18, w: 14, h: 14 }, { px: 14, py: 18, w: 10, h: 14 },
        { px: 24, py: 20, w: 8, h: 12 },
      ]
      for (const st of stones) {
        const shade = 110 + Math.floor(H(st.px, st.py, 80) * 30)
        F(ctx, x + st.px, y + st.py, st.w, st.h, `rgb(${shade},${shade},${shade})`)
        NF(ctx, x + st.px, y + st.py, st.w, st.h, shade, shade, shade, 25, 0.7, 80 + st.px)
        // 边框暗线
        F(ctx, x + st.px, y + st.py, st.w, 1, 'rgba(50,50,50,0.35)')
        F(ctx, x + st.px, y + st.py, 1, st.h, 'rgba(50,50,50,0.3)')
      }
    })

    // ── 7: 橡木木板 ──
    draw(7, (x, y, s) => {
      F(ctx, x, y, s, s, '#bc9862')
      // 横向木板条纹
      for (let py = 0; py < s; py++) {
        const stripe = Math.floor(py / (s / 4))
        const baseShade = stripe % 2 === 0 ? -8 : 8
        for (let px = 0; px < s; px++) {
          const grain = (H(px, py, 90) - 0.5) * 30 + baseShade
          const r = Math.max(0, Math.min(255, Math.round(188 + grain)))
          const g = Math.max(0, Math.min(255, Math.round(152 + grain)))
          const b = Math.max(0, Math.min(255, Math.round(98 + grain)))
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(x + px, y + py, 1, 1)
        }
        // 木板分隔线
        if (py % (s / 4) === 0) {
          F(ctx, x, y + py, s, 1, '#8a6838')
        }
      }
      // 木节
      for (let i = 0; i < 2; i++) {
        const kx = x + 4 + Math.floor(H(i, 0, 95) * (s - 8))
        const ky = y + 4 + Math.floor(H(0, i, 95) * (s - 8))
        F(ctx, kx, ky, 2, 2, '#906838')
        F(ctx, kx + 1, ky + 1, 1, 1, '#705020')
      }
    })

    // ── 8: 橡木原木顶部（年轮） ──
    draw(8, (x, y, s) => {
      F(ctx, x, y, s, s, '#bc9862')
      NF(ctx, x, y, s, s, 188, 152, 98, 20, 0.5, 8)
      const cx = x + s / 2, cy = y + s / 2
      for (let r = 2; r < s / 2; r += 3) {
        for (let a = 0; a < Math.PI * 2; a += 0.05) {
          const px = Math.round(cx + Math.cos(a) * r)
          const py = Math.round(cy + Math.sin(a) * r)
          if (px >= x && px < x + s && py >= y && py < y + s) {
            F(ctx, px, py, 1, 1, r % 6 < 3 ? '#a88550' : '#c8a872')
          }
        }
      }
      F(ctx, Math.floor(cx) - 1, Math.floor(cy) - 1, 2, 2, '#8a6838')
    })

    // ── 9: 橡木原木侧面 ──
    draw(9, (x, y, s) => {
      F(ctx, x, y, s, s, '#6b5030')
      for (let px = 0; px < s; px++) {
        for (let py = 0; py < s; py++) {
          const grain = (H(px, py, 9) - 0.5) * 35
          const r = Math.max(0, Math.min(255, Math.round(107 + grain)))
          const g = Math.max(0, Math.min(255, Math.round(80 + grain * 0.7)))
          const b = Math.max(0, Math.min(255, Math.round(48 + grain * 0.5)))
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(x + px, y + py, 1, 1)
        }
      }
      // 竖向暗纹
      for (let i = 0; i < 6; i++) {
        const px = x + Math.floor(H(i, 0, 99) * s)
        F(ctx, px, y, 1, s, 'rgba(50,35,15,0.4)')
      }
    })

    // ── 10: 橡木树叶 ──
    draw(10, (x, y, s) => {
      F(ctx, x, y, s, s, '#3b7a1a')
      MN(ctx, x, y, s, s, ['#2b6a0a', '#4b8a2a', '#1b5a00', '#55992a', '#205500'], 0.6, 10)
      // 透明感小洞
      for (let i = 0; i < 8; i++) {
        F(ctx, x + Math.floor(H(i, 4, 11) * s), y + Math.floor(H(4, i, 11) * s), 1, 1, 'rgba(20,70,0,0.5)')
      }
    })

    // ── 11: 沙子 ──
    draw(11, (x, y, s) => {
      F(ctx, x, y, s, s, '#e8d5a0')
      NF(ctx, x, y, s, s, 232, 213, 160, 30, 1, 11)
      for (let i = 0; i < 6; i++) {
        F(ctx, x + Math.floor(H(i, 6, 12) * s), y + Math.floor(H(6, i, 12) * s), 1, 1, '#c8b580')
      }
    })

    // ── 12-13: 砂岩 ──
    draw(12, (x, y, s) => {
      F(ctx, x, y, s, s, '#e8d5a0')
      NF(ctx, x, y, s, s, 232, 213, 160, 20, 0.6, 12)
    })
    draw(13, (x, y, s) => {
      F(ctx, x, y, s, s, '#e0cda0')
      NF(ctx, x, y, s, s, 224, 205, 160, 20, 0.5, 13)
      F(ctx, x, y, s, 3, '#d0bd90')
      F(ctx, x, y + Math.floor(s / 2), s, 1, '#c8b580')
    })

    // ── 14: 水 ──
    draw(14, (x, y, s) => {
      F(ctx, x, y, s, s, 'rgba(30,100,200,0.7)')
      for (let py = 0; py < s; py += 2) {
        F(ctx, x, y + py, s, 1, `rgba(50,${110 + Math.floor(py)},220,0.4)`)
      }
      for (let i = 0; i < 4; i++) {
        F(ctx, x + Math.floor(H(i, 8, 14) * s), y + Math.floor(H(8, i, 14) * s), 3, 1, 'rgba(100,160,255,0.3)')
      }
    })

    // ── 15-18,108-111: 矿石 ──
    const drawOre = (idx: number, oreColors: string[], seedBase: number) => {
      draw(idx, (x, y, s) => {
        F(ctx, x, y, s, s, '#7e7e7e')
        NF(ctx, x, y, s, s, 126, 126, 126, 45, 1, seedBase)
        // 矿簇
        for (let i = 0; i < 6; i++) {
          const px = x + 2 + Math.floor(H(i, 2, seedBase + 1) * (s - 6))
          const py = y + 2 + Math.floor(H(2, i, seedBase + 1) * (s - 6))
          const col = oreColors[Math.floor(H(i, 3, seedBase + 2) * oreColors.length)]
          F(ctx, px, py, 2, 2, col)
          if (H(i, 4, seedBase + 3) > 0.4) F(ctx, px + 1, py + 2, 1, 1, col)
          if (H(i, 5, seedBase + 3) > 0.5) F(ctx, px + 2, py + 1, 1, 1, col)
        }
      })
    }
    drawOre(15, ['#2a2a2a', '#1a1a1a', '#333'], 150)   // 煤
    drawOre(16, ['#d4b896', '#c8a880', '#bfa080'], 160) // 铁
    drawOre(17, ['#fcdb4d', '#e8c83d', '#f0d040'], 170) // 金
    drawOre(18, ['#5decf0', '#4ddce0', '#6cf0f4'], 180) // 钻石
    drawOre(108, ['#40c040', '#30b030', '#50d050'], 108) // 绿宝石
    drawOre(109, ['#e02020', '#cc1818', '#f03030'], 109) // 红石
    drawOre(110, ['#2040e0', '#1838d0', '#3050f0'], 110) // 青金石
    drawOre(111, ['#c07040', '#b06030', '#d08050'], 111) // 铜

    // ── 19: 沙砾 ──
    draw(19, (x, y, s) => {
      F(ctx, x, y, s, s, '#8a7a7a')
      MN(ctx, x, y, s, s, ['#7a6a6a', '#9a8a8a', '#6a5a5a', '#a09090', '#605050'], 0.5, 19)
    })

    // ── 20: 粘土 ──
    draw(20, (x, y, s) => {
      F(ctx, x, y, s, s, '#9da4ae')
      NF(ctx, x, y, s, s, 157, 164, 174, 20, 0.6, 20)
    })

    // ── 21: 工作台顶部 ──
    draw(21, (x, y, s) => {
      F(ctx, x, y, s, s, '#bc9862')
      NF(ctx, x, y, s, s, 188, 152, 98, 15, 0.3, 21)
      ctx.strokeStyle = '#6b5030'
      ctx.lineWidth = 1
      // 3×3 网格
      for (let i = 1; i < 3; i++) {
        const p = Math.floor((i / 3) * s)
        F(ctx, x + p, y, 1, s, '#6b5030')
        F(ctx, x, y + p, s, 1, '#6b5030')
      }
    })

    // ── 22: 工作台侧面 ──
    draw(22, (x, y, s) => {
      F(ctx, x, y, s, s, '#bc9862')
      NF(ctx, x, y, s, s, 188, 152, 98, 15, 0.3, 22)
      // 锯子图案
      F(ctx, x + 6, y + 4, 2, 12, '#808080')
      F(ctx, x + 4, y + 4, 6, 2, '#808080')
      F(ctx, x + 16, y + 6, 2, 10, '#a07030')
      F(ctx, x + 14, y + 6, 6, 2, '#a07030')
    })

    // ── 23: 熔炉侧面 ──
    draw(23, (x, y, s) => {
      F(ctx, x, y, s, s, '#7e7e7e')
      NF(ctx, x, y, s, s, 126, 126, 126, 40, 1, 23)
      // 炉口
      F(ctx, x + 8, y + 10, 16, 14, '#3a3a3a')
      F(ctx, x + 9, y + 11, 14, 12, '#2a2a2a')
      // 火焰
      F(ctx, x + 12, y + 16, 8, 6, '#6a4a2a')
      F(ctx, x + 14, y + 14, 4, 2, '#c06020')
    })

    // ── 30-42: 下界方块 ──
    draw(30, (x, y, s) => { F(ctx, x, y, s, s, '#8b3030'); NF(ctx, x, y, s, s, 139, 48, 48, 45, 1, 30) })
    draw(31, (x, y, s) => { F(ctx, x, y, s, s, '#5b4030'); NF(ctx, x, y, s, s, 91, 64, 48, 35, 1, 31) })
    draw(32, (x, y, s) => { F(ctx, x, y, s, s, '#4b3828'); NF(ctx, x, y, s, s, 75, 56, 40, 30, 1, 32) })
    draw(33, (x, y, s) => { F(ctx, x, y, s, s, '#4a4a50'); NF(ctx, x, y, s, s, 74, 74, 80, 30, 1, 33) })
    draw(34, (x, y, s) => {
      F(ctx, x, y, s, s, '#4a4a50')
      NF(ctx, x, y, s, s, 74, 74, 80, 25, 0.6, 34)
      for (let px = 0; px < s; px += 4) F(ctx, x + px, y, 1, s, 'rgba(40,40,45,0.4)')
    })
    draw(35, (x, y, s) => { F(ctx, x, y, s, s, '#2a2a30'); NF(ctx, x, y, s, s, 42, 42, 48, 30, 1, 35) })
    draw(36, (x, y, s) => { F(ctx, x, y, s, s, '#8b2020'); NF(ctx, x, y, s, s, 139, 32, 32, 40, 1, 36) })
    draw(37, (x, y, s) => {
      F(ctx, x, y, s, 5, '#8b2020'); NF(ctx, x, y, s, 5, 139, 32, 32, 30, 0.8, 37)
      F(ctx, x, y + 5, s, s - 5, '#7e7e7e'); NF(ctx, x, y + 5, s, s - 5, 126, 126, 126, 40, 1, 37)
    })
    draw(38, (x, y, s) => { F(ctx, x, y, s, s, '#20808b'); NF(ctx, x, y, s, s, 32, 128, 139, 40, 1, 38) })
    draw(39, (x, y, s) => {
      F(ctx, x, y, s, 5, '#20808b'); NF(ctx, x, y, s, 5, 32, 128, 139, 30, 0.8, 39)
      F(ctx, x, y + 5, s, s - 5, '#7e7e7e'); NF(ctx, x, y + 5, s, s - 5, 126, 126, 126, 40, 1, 39)
    })
    draw(40, (x, y, s) => {
      F(ctx, x, y, s, s, '#8b3030'); NF(ctx, x, y, s, s, 139, 48, 48, 35, 0.8, 40)
      for (let i = 0; i < 5; i++) {
        F(ctx, x + Math.floor(H(i, 0, 40) * (s - 4)), y + Math.floor(H(0, i, 40) * (s - 4)), 4, 3, '#fcdb4d')
      }
    })
    draw(41, (x, y, s) => {
      F(ctx, x, y, s, s, '#fcdb8d')
      MN(ctx, x, y, s, s, ['#fceb9d', '#dcbb6d', '#eccb7d', '#ffe8a0'], 0.4, 41)
    })
    draw(42, (x, y, s) => {
      F(ctx, x, y, s, s, '#2a1520')
      NF(ctx, x, y, s, s, 42, 21, 32, 20, 0.5, 42)
      ctx.strokeStyle = '#1a0510'; ctx.lineWidth = 1
      for (let py = 0; py < s; py += 8) {
        F(ctx, x, y + py, s, 1, '#1a0510')
      }
      for (let px = 0; px < s; px += 16) {
        F(ctx, x + px, y, 1, s, '#1a0510')
        F(ctx, x + px + 8, y + 8, 1, s, '#1a0510')
      }
    })

    // ── 50-52: 末地 ──
    draw(50, (x, y, s) => { F(ctx, x, y, s, s, '#d8d8a0'); NF(ctx, x, y, s, s, 216, 216, 160, 30, 1, 50) })
    draw(51, (x, y, s) => {
      F(ctx, x, y, s, s, '#1a0a2a')
      NF(ctx, x, y, s, s, 26, 10, 42, 30, 1, 51)
      for (let i = 0; i < 6; i++) {
        F(ctx, x + Math.floor(H(i, 3, 51) * s), y + Math.floor(H(3, i, 51) * s), 2, 2, 'rgba(60,20,100,0.4)')
      }
    })
    draw(52, (x, y, s) => { F(ctx, x, y, s, s, '#a070b0'); NF(ctx, x, y, s, s, 160, 112, 176, 30, 1, 52) })

    // ── 60-64: 建筑方块 ──
    draw(60, (x, y, s) => {
      F(ctx, x, y, s, s, '#808080')
      NF(ctx, x, y, s, s, 128, 128, 128, 25, 0.5, 60)
      for (let py = 0; py < s; py += 8) {
        F(ctx, x, y + py, s, 1, '#6a6a6a')
        const off = (py % 16 === 0) ? 0 : 8
        for (let px = off; px < s; px += 16) F(ctx, x + px, y + py, 1, 8, '#6a6a6a')
      }
    })
    draw(61, (x, y, s) => {
      F(ctx, x, y, s, s, '#708070')
      NF(ctx, x, y, s, s, 112, 128, 112, 25, 0.5, 61)
      for (let py = 0; py < s; py += 8) F(ctx, x, y + py, s, 1, '#5a6a5a')
      for (let i = 0; i < 6; i++) {
        F(ctx, x + Math.floor(H(i, 2, 61) * s), y + Math.floor(H(2, i, 61) * s), 3, 2, '#4a6a3a')
      }
    })
    draw(62, (x, y, s) => {
      F(ctx, x, y, s, s, '#9b5b4b')
      NF(ctx, x, y, s, s, 155, 91, 75, 25, 0.5, 62)
      for (let py = 0; py < s; py += 8) {
        F(ctx, x, y + py, s, 1, '#c8b8a0')
        const off = (py % 16 === 0) ? 0 : 8
        for (let px = off; px < s; px += 16) F(ctx, x + px, y + py, 1, 8, '#c8b8a0')
      }
    })
    draw(63, (x, y, s) => {
      F(ctx, x, y, s, s, '#bc9862')
      NF(ctx, x, y, s, s, 188, 152, 98, 15, 0.3, 63)
      const bookColors = ['#8b2020', '#20408b', '#208b40', '#8b8020', '#6b2060']
      for (let row = 0; row < 4; row++) {
        const by = 2 + row * 7
        F(ctx, x, by, s, 6, '#bc9862')
        for (let bx = 2; bx < s - 2; bx += 3) {
          F(ctx, x + bx, by + 1, 2, 5, bookColors[Math.floor(H(bx, by, 63) * bookColors.length)])
        }
      }
    })
    draw(64, (x, y, s) => {
      F(ctx, x, y, s, s, 'rgba(200,220,255,0.25)')
      ctx.strokeStyle = 'rgba(180,200,240,0.5)'; ctx.lineWidth = 1
      ctx.strokeRect(x + 1, y + 1, s - 2, s - 2)
      F(ctx, x + 2, y + 2, 4, 2, 'rgba(220,240,255,0.4)')
    })

    // ── 70-73: 矿物块 ──
    draw(70, (x, y, s) => {
      F(ctx, x, y, s, s, '#d8d8d8')
      NF(ctx, x, y, s, s, 216, 216, 216, 15, 0.5, 70)
      ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, s - 2, s - 2)
      F(ctx, x + 2, y + 2, 3, 2, 'rgba(240,240,240,0.5)')
    })
    draw(71, (x, y, s) => {
      F(ctx, x, y, s, s, '#fcdb4d')
      NF(ctx, x, y, s, s, 252, 219, 77, 20, 0.5, 71)
      ctx.strokeStyle = '#e8c83d'; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, s - 2, s - 2)
      F(ctx, x + 2, y + 2, 3, 2, 'rgba(255,240,120,0.5)')
    })
    draw(72, (x, y, s) => {
      F(ctx, x, y, s, s, '#5decf0')
      NF(ctx, x, y, s, s, 93, 236, 240, 20, 0.5, 72)
      ctx.strokeStyle = '#4ddce0'; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, s - 2, s - 2)
    })
    draw(73, (x, y, s) => {
      F(ctx, x, y, s, s, '#3a3238')
      NF(ctx, x, y, s, s, 58, 50, 56, 20, 0.5, 73)
      ctx.strokeStyle = '#4a4248'; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, s - 2, s - 2)
    })

    // ── 80: 箱子 ──
    draw(80, (x, y, s) => {
      F(ctx, x, y, s, s, '#a07030')
      NF(ctx, x, y, s, s, 160, 112, 48, 20, 0.4, 80)
      F(ctx, x, y + Math.floor(s / 2) - 1, s, 2, '#6b5030')
      F(ctx, x + Math.floor(s / 2) - 1, y + Math.floor(s / 2) - 2, 3, 4, '#fcdb4d')
    })

    // ── 81: 刷怪笼 ──
    draw(81, (x, y, s) => {
      F(ctx, x, y, s, s, '#3a3a3a')
      NF(ctx, x, y, s, s, 58, 58, 58, 20, 0.5, 81)
      ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        const rx = Math.floor(H(i, 0, 81) * (s - 6))
        const ry = Math.floor(H(0, i, 81) * (s - 6))
        ctx.strokeRect(x + rx, y + ry, 4, 4)
      }
    })

    // ── 82-84: TNT ──
    draw(82, (x, y, s) => {
      F(ctx, x, y, s, s, '#c84040')
      NF(ctx, x, y, s, s, 200, 64, 64, 30, 0.5, 82)
      F(ctx, x + 4, y + 4, s - 8, s - 8, '#a03030')
    })
    draw(83, (x, y, s) => {
      F(ctx, x, y, s, s, '#a03030')
      NF(ctx, x, y, s, s, 160, 48, 48, 20, 0.5, 83)
    })
    draw(84, (x, y, s) => {
      F(ctx, x, y, s, s, '#c84040')
      F(ctx, x + 3, y + 8, s - 6, s - 12, '#e8e8e8')
      ctx.fillStyle = '#000'; ctx.font = `${Math.floor(s * 0.35)}px monospace`
      ctx.fillText('TNT', x + 5, y + s - 8)
    })

    // ── 85-92: 石头变种 ──
    draw(85, (x, y, s) => { F(ctx, x, y, s, s, '#9b6b5a'); NF(ctx, x, y, s, s, 155, 107, 90, 30, 1, 85) })
    draw(86, (x, y, s) => { F(ctx, x, y, s, s, '#a07060'); NF(ctx, x, y, s, s, 160, 112, 96, 20, 0.5, 86) })
    draw(87, (x, y, s) => { F(ctx, x, y, s, s, '#c8c0b8'); NF(ctx, x, y, s, s, 200, 192, 184, 25, 1, 87) })
    draw(88, (x, y, s) => { F(ctx, x, y, s, s, '#d0c8c0'); NF(ctx, x, y, s, s, 208, 200, 192, 15, 0.5, 88) })
    draw(89, (x, y, s) => { F(ctx, x, y, s, s, '#8a8a8a'); NF(ctx, x, y, s, s, 138, 138, 138, 30, 1, 89) })
    draw(90, (x, y, s) => { F(ctx, x, y, s, s, '#909090'); NF(ctx, x, y, s, s, 144, 144, 144, 15, 0.5, 90) })
    draw(91, (x, y, s) => { F(ctx, x, y, s, s, '#909090'); NF(ctx, x, y, s, s, 144, 144, 144, 12, 0.3, 91) })
    draw(92, (x, y, s) => {
      F(ctx, x, y, s, s, '#7a7a7a'); NF(ctx, x, y, s, s, 122, 122, 122, 35, 0.8, 92)
      for (let i = 0; i < 8; i++) {
        F(ctx, x + Math.floor(H(i, 0, 92) * (s - 4)), y + Math.floor(H(0, i, 92) * (s - 4)), 3, 3, '#5a7a5a')
      }
    })

    // ── 93-107: 木头变种 ──
    draw(93, (x, y, s) => {
      F(ctx, x, y, s, s, '#3b2810')
      for (let px = 0; px < s; px++) for (let py = 0; py < s; py++) {
        const n = (H(px, py, 93) - 0.5) * 25
        ctx.fillStyle = `rgb(${Math.round(59 + n)},${Math.round(40 + n * 0.7)},${Math.round(16 + n * 0.3)})`
        ctx.fillRect(x + px, y + py, 1, 1)
      }
      for (let i = 0; i < 5; i++) F(ctx, x + Math.floor(H(i, 0, 93) * s), y, 1, s, 'rgba(20,10,0,0.35)')
    })
    draw(94, (x, y, s) => { F(ctx, x, y, s, s, '#6b5030'); NF(ctx, x, y, s, s, 107, 80, 48, 18, 0.5, 94) })
    draw(95, (x, y, s) => { F(ctx, x, y, s, s, '#2b5a1a'); MN(ctx, x, y, s, s, ['#1b4a0a', '#3b6a2a', '#0a3a00'], 0.5, 95) })
    draw(96, (x, y, s) => {
      F(ctx, x, y, s, s, '#d8d0c0')
      NF(ctx, x, y, s, s, 216, 208, 192, 15, 0.4, 96)
      for (let py = 0; py < s; py += 6) if (H(0, py, 96) > 0.4) F(ctx, x, y + py, s, 1, '#3a3a3a')
    })
    draw(97, (x, y, s) => { F(ctx, x, y, s, s, '#d8d0b0'); NF(ctx, x, y, s, s, 216, 208, 176, 12, 0.4, 97) })
    draw(98, (x, y, s) => { F(ctx, x, y, s, s, '#4b8a2a'); MN(ctx, x, y, s, s, ['#3b7a1a', '#5b9a3a', '#2a6a10'], 0.5, 98) })
    draw(99, (x, y, s) => { F(ctx, x, y, s, s, '#6b5030'); NF(ctx, x, y, s, s, 107, 80, 48, 25, 0.7, 99) })
    draw(100, (x, y, s) => { F(ctx, x, y, s, s, '#a07050'); NF(ctx, x, y, s, s, 160, 112, 80, 15, 0.4, 100) })
    draw(101, (x, y, s) => { F(ctx, x, y, s, s, '#2b7a1a'); MN(ctx, x, y, s, s, ['#1b6a0a', '#3b8a2a', '#106000'], 0.5, 101) })
    draw(102, (x, y, s) => { F(ctx, x, y, s, s, '#5a5050'); NF(ctx, x, y, s, s, 90, 80, 80, 25, 0.7, 102) })
    draw(103, (x, y, s) => { F(ctx, x, y, s, s, '#b06030'); NF(ctx, x, y, s, s, 176, 96, 48, 15, 0.4, 103) })
    draw(104, (x, y, s) => { F(ctx, x, y, s, s, '#3b7a2a'); MN(ctx, x, y, s, s, ['#2b6a1a', '#4b8a3a', '#1a5a10'], 0.5, 104) })
    draw(105, (x, y, s) => { F(ctx, x, y, s, s, '#3a2810'); NF(ctx, x, y, s, s, 58, 40, 16, 25, 0.7, 105) })
    draw(106, (x, y, s) => { F(ctx, x, y, s, s, '#4b3020'); NF(ctx, x, y, s, s, 75, 48, 32, 15, 0.4, 106) })
    draw(107, (x, y, s) => { F(ctx, x, y, s, s, '#2b5a0a'); MN(ctx, x, y, s, s, ['#1b4a00', '#3b6a1a', '#0a3a00'], 0.5, 107) })

    // ── 112-116: 深层矿物块 ──
    draw(112, (x, y, s) => { F(ctx, x, y, s, s, '#3a3a40'); NF(ctx, x, y, s, s, 58, 58, 64, 25, 1, 112) })
    draw(113, (x, y, s) => { F(ctx, x, y, s, s, '#c07040'); NF(ctx, x, y, s, s, 192, 112, 64, 20, 0.5, 113); ctx.strokeStyle = '#b06030'; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, s - 2, s - 2) })
    draw(114, (x, y, s) => { F(ctx, x, y, s, s, '#40c040'); NF(ctx, x, y, s, s, 64, 192, 64, 20, 0.5, 114); ctx.strokeStyle = '#30b030'; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, s - 2, s - 2) })
    draw(115, (x, y, s) => { F(ctx, x, y, s, s, '#2040e0'); NF(ctx, x, y, s, s, 32, 64, 224, 20, 0.5, 115); ctx.strokeStyle = '#1838d0'; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, s - 2, s - 2) })
    draw(116, (x, y, s) => { F(ctx, x, y, s, s, '#e02020'); NF(ctx, x, y, s, s, 224, 32, 32, 20, 0.5, 116); ctx.strokeStyle = '#c01818'; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, s - 2, s - 2) })

    // ── 117-132: 羊毛 ──
    const woolColors = [
      '#e8e8e8', '#e08040', '#b040c0', '#6090e0', '#e0d040', '#60d040',
      '#e070a0', '#505050', '#a0a0a0', '#3090a0', '#8040b0', '#3040b0',
      '#704020', '#407020', '#a03030', '#1a1a1a'
    ]
    woolColors.forEach((c, i) => {
      draw(117 + i, (x, y, s) => {
        F(ctx, x, y, s, s, c)
        NF(ctx, x, y, s, s, parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 25, 0.5, 117 + i)
      })
    })

    // ── 133-146: 混凝土 ──
    const concreteColors = [
      '#c8c8c8', '#c06820', '#a030a0', '#4070c0', '#c0b020', '#50b030',
      '#c06080', '#404040', '#808080', '#2080a0', '#6030a0', '#2030a0',
      '#603010', '#306010', '#801010', '#101010'
    ]
    concreteColors.forEach((c, i) => {
      draw(133 + i, (x, y, s) => {
        F(ctx, x, y, s, s, c)
        NF(ctx, x, y, s, s, parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 12, 0.3, 133 + i)
      })
    })

    // ── 147-155: 杂项 ──
    draw(147, (x, y, s) => { F(ctx, x, y, s, s, '#a0705a'); NF(ctx, x, y, s, s, 160, 112, 90, 20, 0.5, 147) })
    draw(148, (x, y, s) => { F(ctx, x, y, s, s, '#c06030'); NF(ctx, x, y, s, s, 192, 96, 48, 30, 1, 148) })
    draw(149, (x, y, s) => { F(ctx, x, y, s, s, '#c06030'); NF(ctx, x, y, s, s, 192, 96, 48, 20, 0.5, 149) })
    draw(150, (x, y, s) => {
      F(ctx, x, y, s, s, '#6b1010'); NF(ctx, x, y, s, s, 107, 16, 16, 20, 0.5, 150)
      for (let py = 0; py < s; py += 8) F(ctx, x, y + py, s, 1, '#4b0000')
    })
    draw(151, (x, y, s) => {
      F(ctx, x, y, s, s, '#8b3030'); NF(ctx, x, y, s, s, 139, 48, 48, 30, 0.8, 151)
      for (let i = 0; i < 5; i++) F(ctx, x + Math.floor(H(i, 0, 151) * (s - 3)), y + Math.floor(H(0, i, 151) * (s - 3)), 2, 2, '#fcdb4d')
    })
    draw(152, (x, y, s) => {
      F(ctx, x, y, s, s, '#8b3030'); NF(ctx, x, y, s, s, 139, 48, 48, 30, 0.8, 152)
      for (let i = 0; i < 5; i++) F(ctx, x + Math.floor(H(i, 0, 152) * (s - 3)), y + Math.floor(H(0, i, 152) * (s - 3)), 3, 2, '#e8e8d8')
    })
    draw(153, (x, y, s) => { F(ctx, x, y, s, s, '#e8e0d0'); NF(ctx, x, y, s, s, 232, 224, 208, 12, 0.4, 153) })
    draw(154, (x, y, s) => {
      F(ctx, x, y, s, s, '#d8d8a0'); NF(ctx, x, y, s, s, 216, 216, 160, 20, 0.5, 154)
      for (let py = 0; py < s; py += 8) {
        F(ctx, x, y + py, s, 1, '#b8b880')
        const off = (py % 16 === 0) ? 0 : 8
        for (let px = off; px < s; px += 16) F(ctx, x + px, y + py, 1, 8, '#b8b880')
      }
    })
    draw(155, (x, y, s) => {
      F(ctx, x, y, s, s, '#1a0a2a'); NF(ctx, x, y, s, s, 26, 10, 42, 25, 0.8, 155)
      for (let i = 0; i < 5; i++) F(ctx, x + Math.floor(H(i, 0, 155) * (s - 3)), y + Math.floor(H(0, i, 155) * (s - 3)), 2, 3, '#6030c0')
    })

    // ── 156-169: 工具方块 ──
    draw(156, (x, y, s) => { F(ctx, x, y, s, s, '#4a4a4a'); NF(ctx, x, y, s, s, 74, 74, 74, 20, 0.5, 156); F(ctx, x + 4, y + 4, s - 8, 6, '#3a3a3a') })
    draw(157, (x, y, s) => { F(ctx, x, y, s, s, '#808080'); NF(ctx, x, y, s, s, 128, 128, 128, 20, 0.5, 157); F(ctx, x + 8, y + 4, 16, 24, '#606060') })
    draw(158, (x, y, s) => { F(ctx, x, y, s, s, '#808080'); NF(ctx, x, y, s, s, 128, 128, 128, 25, 0.6, 158) })
    draw(159, (x, y, s) => { F(ctx, x, y, s, s, '#bc9862'); NF(ctx, x, y, s, s, 188, 152, 98, 12, 0.4, 159) })
    draw(160, (x, y, s) => { F(ctx, x, y, s, s, '#bc9862'); NF(ctx, x, y, s, s, 188, 152, 98, 12, 0.4, 160) })
    draw(161, (x, y, s) => { F(ctx, x, y, s, s, '#bc9862'); NF(ctx, x, y, s, s, 188, 152, 98, 12, 0.4, 161) })
    draw(162, (x, y, s) => { F(ctx, x, y, s, s, '#4a4a4a'); NF(ctx, x, y, s, s, 74, 74, 74, 18, 0.5, 162) })
    draw(163, (x, y, s) => { F(ctx, x, y, s, s, '#808080'); NF(ctx, x, y, s, s, 128, 128, 128, 20, 0.5, 163); F(ctx, x + 8, y + 10, 16, 14, '#c06030') })
    draw(164, (x, y, s) => { F(ctx, x, y, s, s, '#808080'); NF(ctx, x, y, s, s, 128, 128, 128, 20, 0.5, 164); F(ctx, x + 8, y + 10, 16, 14, '#4a3020') })
    draw(165, (x, y, s) => { F(ctx, x, y, s, s, '#6b5030'); NF(ctx, x, y, s, s, 107, 80, 48, 25, 0.6, 165) })
    draw(166, (x, y, s) => { F(ctx, x, y, s, s, '#a07030'); NF(ctx, x, y, s, s, 160, 112, 48, 18, 0.5, 166) })
    draw(167, (x, y, s) => { F(ctx, x, y, s, s, '#c0a040'); NF(ctx, x, y, s, s, 192, 160, 64, 20, 0.5, 167); F(ctx, x + 8, y + 4, 16, 24, '#a08030') })
    draw(168, (x, y, s) => { F(ctx, x, y, s, s, '#bc9862'); NF(ctx, x, y, s, s, 188, 152, 98, 12, 0.4, 168) })
    draw(169, (x, y, s) => {
      F(ctx, x, y, s, s, '#4060c0'); NF(ctx, x, y, s, s, 64, 96, 192, 15, 0.4, 169)
      F(ctx, x + 8, y + 8, 16, 16, '#80a0e0')
      F(ctx, x + 12, y + 12, 8, 8, '#c0d0ff')
    })

    // ── 170-173: 冰和雪 ──
    draw(170, (x, y, s) => { F(ctx, x, y, s, s, '#80b0e0'); NF(ctx, x, y, s, s, 128, 176, 224, 15, 0.4, 170) })
    draw(171, (x, y, s) => { F(ctx, x, y, s, s, '#90c0e0'); NF(ctx, x, y, s, s, 144, 192, 224, 10, 0.3, 171) })
    draw(172, (x, y, s) => { F(ctx, x, y, s, s, '#4080d0'); NF(ctx, x, y, s, s, 64, 128, 208, 10, 0.3, 172) })
    draw(173, (x, y, s) => { F(ctx, x, y, s, s, '#f0f0f0'); NF(ctx, x, y, s, s, 240, 240, 240, 15, 0.5, 173) })

    // ── 174-181: 植物 ──
    draw(174, (x, y, s) => {
      F(ctx, x, y, s, s, '#30802a')
      for (let py = 0; py < s; py += 4) F(ctx, x, y + py, s, 1, '#20601a')
      NF(ctx, x, y, s, s, 48, 128, 42, 20, 0.4, 174)
    })
    draw(175, (x, y, s) => { F(ctx, x, y, s, s, '#80c040'); for (let py = 0; py < s; py += 6) F(ctx, x, y + py, s, 1, '#60a030') })
    draw(176, (x, y, s) => {
      F(ctx, x, y, s, s, '#d08020')
      for (let px = 0; px < s; px += 6) F(ctx, x + px, y, 3, s, '#a06010')
      NF(ctx, x, y, s, s, 208, 128, 32, 20, 0.4, 176)
    })
    draw(177, (x, y, s) => {
      F(ctx, x, y, s, s, '#60a030')
      for (let px = 0; px < s; px += 6) F(ctx, x + px, y, 3, s, '#408020')
      NF(ctx, x, y, s, s, 96, 160, 48, 20, 0.4, 177)
    })
    draw(178, (x, y, s) => { F(ctx, x, y, s, s, '#c0a040'); NF(ctx, x, y, s, s, 192, 160, 64, 18, 0.5, 178) })
    draw(179, (x, y, s) => { F(ctx, x, y, s, s, '#e0e0c0'); NF(ctx, x, y, s, s, 224, 224, 192, 15, 0.4, 179) })
    draw(180, (x, y, s) => { F(ctx, x, y, s, s, '#204020'); NF(ctx, x, y, s, s, 32, 64, 32, 25, 0.6, 180) })
    draw(181, (x, y, s) => { F(ctx, x, y, s, s, '#80c040'); NF(ctx, x, y, s, s, 128, 192, 64, 15, 0.4, 181) })

    // ── 182-185: 海晶石 ──
    draw(182, (x, y, s) => { F(ctx, x, y, s, s, '#609080'); NF(ctx, x, y, s, s, 96, 144, 128, 25, 0.6, 182) })
    draw(183, (x, y, s) => {
      F(ctx, x, y, s, s, '#609080'); NF(ctx, x, y, s, s, 96, 144, 128, 15, 0.3, 183)
      for (let py = 0; py < s; py += 8) F(ctx, x, y + py, s, 1, '#407060')
    })
    draw(184, (x, y, s) => { F(ctx, x, y, s, s, '#304830'); NF(ctx, x, y, s, s, 48, 72, 48, 25, 0.6, 184) })
    draw(185, (x, y, s) => {
      F(ctx, x, y, s, s, '#a0d0d0'); NF(ctx, x, y, s, s, 160, 208, 208, 15, 0.4, 185)
      for (let i = 0; i < 6; i++) F(ctx, x + Math.floor(H(i, 0, 185) * (s - 4)), y + Math.floor(H(0, i, 185) * (s - 4)), 4, 3, '#c0f0f0')
    })

    // ── 186-189: 蘑菇 ──
    draw(186, (x, y, s) => { F(ctx, x, y, s, s, '#c0b090'); NF(ctx, x, y, s, s, 192, 176, 144, 18, 0.5, 186) })
    draw(187, (x, y, s) => { F(ctx, x, y, s, s, '#c03030'); NF(ctx, x, y, s, s, 192, 48, 48, 25, 0.6, 187) })
    draw(188, (x, y, s) => { F(ctx, x, y, s, s, '#806040'); NF(ctx, x, y, s, s, 128, 96, 64, 25, 0.6, 188) })
    draw(189, (x, y, s) => {
      F(ctx, x, y, s, 6, '#603040'); NF(ctx, x, y, s, 6, 96, 48, 64, 20, 0.6, 189)
      F(ctx, x, y + 6, s, s - 6, '#8b5a2b'); NF(ctx, x, y + 6, s, s - 6, 139, 90, 43, 35, 1, 189)
    })

    // ── 190-195: 铁轨和火把 ──
    draw(190, (x, y, s) => {
      F(ctx, x + 4, y, 3, s, '#808080')
      F(ctx, x + s - 7, y, 3, s, '#808080')
      for (let py = 0; py < s; py += 6) F(ctx, x + 4, y + py, s - 8, 2, '#606060')
    })
    draw(191, (x, y, s) => {
      F(ctx, x + 13, y + 8, 6, 20, '#806030')
      F(ctx, x + 11, y + 2, 10, 9, '#f0c030')
      F(ctx, x + 13, y + 4, 6, 5, '#ffe060')
    })
    draw(192, (x, y, s) => {
      F(ctx, x + 13, y + 8, 6, 20, '#806030')
      F(ctx, x + 11, y + 2, 10, 9, '#40c0c0')
      F(ctx, x + 13, y + 4, 6, 5, '#60e0e0')
    })
    draw(193, (x, y, s) => {
      F(ctx, x + 6, y + 4, 20, 24, '#606060')
      F(ctx, x + 9, y + 8, 14, 16, '#f0c030')
      F(ctx, x + 12, y + 11, 8, 10, '#ffe060')
    })
    draw(194, (x, y, s) => {
      F(ctx, x + 6, y + 4, 20, 24, '#606060')
      F(ctx, x + 9, y + 8, 14, 16, '#40c0c0')
      F(ctx, x + 12, y + 11, 8, 10, '#60e0e0')
    })
    draw(195, (x, y, s) => {
      F(ctx, x + 13, y, 6, s, '#606060')
      for (let py = 0; py < s; py += 6) F(ctx, x + 13, y + py, 6, 3, '#404040')
    })

    // ── 196-203: 红石元件 ──
    draw(196, (x, y, s) => {
      F(ctx, x, y, s, s, '#6b1010')
      ctx.strokeStyle = '#f02a20'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(x + 2, y + s / 2); ctx.lineTo(x + s - 2, y + s / 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x + s / 2, y + 2); ctx.lineTo(x + s / 2, y + s - 2); ctx.stroke()
    })
    draw(197, (x, y, s) => {
      F(ctx, x, y, s, s, '#b5965a')
      ctx.strokeStyle = '#5b4930'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, s - 6, s - 6)
      F(ctx, x + 12, y + 12, 8, 8, '#8c713e')
    })
    draw(198, (x, y, s) => {
      F(ctx, x, y, s, s, '#737373'); NF(ctx, x, y, s, s, 115, 115, 115, 20, 0.4, 198)
      F(ctx, x + 2, y + 6, s - 4, 12, '#a98245')
      F(ctx, x + 12, y + 18, 8, 14, '#4a4a4a')
    })
    draw(199, (x, y, s) => {
      F(ctx, x, y, s, s, '#79a84f')
      ctx.strokeStyle = '#405f2c'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, s - 6, s - 6)
      F(ctx, x + 12, y + 12, 8, 8, '#a9cb66')
    })
    draw(200, (x, y, s) => {
      F(ctx, x, y, s, s, '#d7d3c9'); NF(ctx, x, y, s, s, 215, 211, 201, 10, 0.3, 200)
      F(ctx, x + 6, y + 6, 4, 6, '#b51d18'); F(ctx, x + 22, y + 20, 4, 6, '#b51d18')
    })
    draw(201, (x, y, s) => {
      F(ctx, x, y, s, s, '#d7d3c9'); NF(ctx, x, y, s, s, 215, 211, 201, 10, 0.3, 201)
      F(ctx, x + 14, y + 6, 4, 6, '#b51d18'); F(ctx, x + 6, y + 20, 4, 6, '#b51d18'); F(ctx, x + 22, y + 20, 4, 6, '#b51d18')
    })
    draw(202, (x, y, s) => {
      F(ctx, x, y, s, s, '#777'); NF(ctx, x, y, s, s, 119, 119, 119, 15, 0.4, 202)
      F(ctx, x + 6, y + 10, 8, 8, '#393939'); F(ctx, x + 20, y + 10, 6, 8, '#393939')
      F(ctx, x + 12, y + 24, 8, 4, '#d22a22')
    })
    draw(203, (x, y, s) => {
      F(ctx, x, y, s, s, '#4f555b'); NF(ctx, x, y, s, s, 79, 85, 91, 15, 0.4, 203)
      F(ctx, x + 4, y + 4, s - 8, 8, '#22272b')
      F(ctx, x + 8, y + 14, s - 16, 8, '#707981')
      F(ctx, x + 12, y + 22, 8, 10, '#707981')
    })

    // ── 210-217: 指令方块 ──
    draw(210, (x, y, s) => {
      F(ctx, x, y, s, s, '#ff9800')
      F(ctx, x, y, s, 3, '#e65100'); F(ctx, x, y + s - 3, s, 3, '#e65100')
      F(ctx, x, y, 3, s, '#e65100'); F(ctx, x + s - 3, y, 3, s, '#e65100')
      F(ctx, x + 12, y + 8, 8, 16, '#fff'); F(ctx, x + 10, y + 14, 12, 4, '#fff')
    })
    draw(211, (x, y, s) => {
      F(ctx, x, y, s, s, '#4caf50')
      F(ctx, x, y, s, 3, '#1b5e20'); F(ctx, x, y + s - 3, s, 3, '#1b5e20')
      F(ctx, x, y, 3, s, '#1b5e20'); F(ctx, x + s - 3, y, 3, s, '#1b5e20')
      F(ctx, x + 8, y + 14, 16, 4, '#fff'); F(ctx, x + 20, y + 10, 4, 12, '#fff')
    })
    draw(212, (x, y, s) => {
      F(ctx, x, y, s, s, '#9c27b0')
      F(ctx, x, y, s, 3, '#4a148c'); F(ctx, x, y + s - 3, s, 3, '#4a148c')
      F(ctx, x, y, 3, s, '#4a148c'); F(ctx, x + s - 3, y, 3, s, '#4a148c')
      F(ctx, x + 8, y + 8, 16, 4, '#fff'); F(ctx, x + 20, y + 8, 4, 8, '#fff')
      F(ctx, x + 8, y + 20, 16, 4, '#fff'); F(ctx, x + 8, y + 16, 4, 8, '#fff')
    })
    draw(213, (x, y, s) => {
      F(ctx, x, y, s, s, 'rgba(255,0,0,0.3)')
      ctx.strokeStyle = '#f44336'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + s - 3, y + s - 3); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x + s - 3, y + 3); ctx.lineTo(x + 3, y + s - 3); ctx.stroke()
    })
    draw(214, (x, y, s) => {
      F(ctx, x, y, s, s, '#00bcd4')
      F(ctx, x, y, s, 3, '#006064'); F(ctx, x, y + s - 3, s, 3, '#006064')
      F(ctx, x, y, 3, s, '#006064'); F(ctx, x + s - 3, y, 3, s, '#006064')
      F(ctx, x + 8, y + 20, 16, 4, '#fff'); F(ctx, x + 10, y + 12, 4, 8, '#fff'); F(ctx, x + 18, y + 8, 4, 12, '#fff')
    })
    draw(215, (x, y, s) => {
      F(ctx, x, y, s, s, '#ffeb3b')
      F(ctx, x, y, s, 3, '#f57f17'); F(ctx, x, y + s - 3, s, 3, '#f57f17')
      F(ctx, x, y, 3, s, '#f57f17'); F(ctx, x + s - 3, y, 3, s, '#f57f17')
      F(ctx, x + 8, y + 8, 6, 6, '#fff'); F(ctx, x + 18, y + 8, 6, 6, '#fff')
      F(ctx, x + 8, y + 18, 6, 6, '#fff'); F(ctx, x + 18, y + 18, 6, 6, '#fff')
    })
    draw(216, (x, y, s) => {
      F(ctx, x, y, s, s, '#ffffc8')
      F(ctx, x + 3, y + 3, s - 6, s - 6, '#fffde7')
      F(ctx, x + 6, y + 6, s - 12, s - 12, '#fff')
      F(ctx, x + 14, y, 4, 3, '#ffd54f'); F(ctx, x + 14, y + s - 3, 4, 3, '#ffd54f')
      F(ctx, x, y + 14, 3, 4, '#ffd54f'); F(ctx, x + s - 3, y + 14, 3, 4, '#ffd54f')
    })
    draw(217, (x, y, s) => {
      F(ctx, x, y, s, s, 'rgba(200,200,255,0.15)')
      ctx.strokeStyle = 'rgba(200,200,255,0.4)'; ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.strokeRect(x + 2, y + 2, s - 4, s - 4)
      ctx.setLineDash([])
    })

    // ── 218: 钢矿石 ──
    draw(218, (x, y, s) => {
      F(ctx, x, y, s, s, '#3a3a40')
      NF(ctx, x, y, s, s, 58, 58, 64, 18, 0.6, 218)
      F(ctx, x + 6, y + 8, 6, 5, '#8899bb')
      F(ctx, x + 18, y + 4, 5, 6, '#99aacc')
      F(ctx, x + 12, y + 18, 8, 5, '#aabbdd')
      F(ctx, x + 4, y + 22, 5, 5, '#7788aa')
      F(ctx, x + 22, y + 14, 4, 5, '#8899bb')
    })

    // ── 219: 钢块 ──
    draw(219, (x, y, s) => {
      F(ctx, x, y, s, s, '#b0b8c4')
      F(ctx, x + 2, y + 2, s - 4, s - 4, '#c0c8d4')
      F(ctx, x + 4, y + 6, s - 8, 3, '#a8b0bc')
      F(ctx, x + 4, y + 14, s - 8, 2, '#b8c0cc')
      F(ctx, x + 4, y + 22, s - 8, 3, '#a0a8b4')
      ctx.strokeStyle = '#d0d8e0'; ctx.lineWidth = 1; ctx.strokeRect(x + 2, y + 2, s - 4, s - 4)
      F(ctx, x + 4, y + 3, 5, 3, 'rgba(220,230,245,0.5)')
    })

    // ── 220: 地狱传送门（紫色漩涡） ──
    draw(220, (x, y, s) => {
      // 深紫色基底
      F(ctx, x, y, s, s, '#1a0530')
      // 紫色漩涡条纹
      for (let py = 0; py < s; py++) {
        const shade = 80 + Math.floor(H(0, py, 220) * 100)
        F(ctx, x, y + py, s, 1, `rgba(${shade}, 30, ${shade + 80}, 0.7)`)
      }
      // 亮点
      for (let i = 0; i < 12; i++) {
        const px = Math.floor(H(i, 0, 221) * s)
        const py = Math.floor(H(0, i, 221) * s)
        F(ctx, x + px, y + py, 2, 2, `rgba(200, 100, 255, ${0.3 + H(i, i, 222) * 0.5})`)
      }
      // 竖向紫色光柱
      for (let px = 0; px < s; px += 4) {
        const alpha = 0.1 + H(px, 0, 223) * 0.3
        F(ctx, x + px, y, 1, s, `rgba(160, 60, 220, ${alpha})`)
      }
    })

    // ── 221: 末地传送门（星空表面） ──
    draw(221, (x, y, s) => {
      // 深黑蓝基底
      F(ctx, x, y, s, s, '#020210')
      // 星星
      for (let i = 0; i < 20; i++) {
        const px = Math.floor(H(i, 0, 224) * s)
        const py = Math.floor(H(0, i, 224) * s)
        const brightness = 150 + Math.floor(H(i, i, 225) * 105)
        const size = H(i, 3, 225) > 0.7 ? 2 : 1
        F(ctx, x + px, y + py, size, size, `rgb(${brightness}, ${brightness}, ${brightness + 30})`)
      }
      // 蓝绿色微光
      for (let i = 0; i < 6; i++) {
        const px = Math.floor(H(i, 5, 226) * (s - 3))
        const py = Math.floor(H(5, i, 226) * (s - 3))
        F(ctx, x + px, y + py, 3, 3, `rgba(40, 180, 160, 0.2)`)
      }
    })

    // ── 222: 末地传送门框架 ──
    draw(222, (x, y, s) => {
      // 深灰色石质框架
      F(ctx, x, y, s, s, '#3a3a3a')
      NF(ctx, x, y, s, s, 58, 58, 58, 25, 0.6, 222)
      // 顶部绿色苔藓/末影之眼插槽
      F(ctx, x + 2, y + 2, s - 4, s - 4, '#2a2a2a')
      // 中央凹槽
      F(ctx, x + 8, y + 8, s - 16, s - 16, '#1a1a1a')
      // 绿色末影之眼
      F(ctx, x + 11, y + 11, s - 22, s - 22, '#40c060')
      F(ctx, x + 13, y + 13, s - 26, s - 26, '#60e080')
      // 边缘装饰
      F(ctx, x, y, s, 2, '#4a4a4a')
      F(ctx, x, y + s - 2, s, 2, '#4a4a4a')
      F(ctx, x, y, 2, s, '#4a4a4a')
      F(ctx, x + s - 2, y, 2, s, '#4a4a4a')
    })
  }

  dispose(): void {
    this.texture.dispose()
  }
}
