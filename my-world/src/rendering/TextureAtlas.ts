import * as THREE from 'three'
import { ATLAS_SIZE, TEXTURE_RESOLUTION } from '@/utils/constants'
import { BlockType, BLOCK_REGISTRY } from '@/types/blocks'

/**
 * TextureAtlas - 纹理图集
 * 将所有方块纹理打包到一张大纹理中
 */
export class TextureAtlas {
  public texture: THREE.Texture
  public readonly atlasSize = ATLAS_SIZE
  public readonly texResolution = TEXTURE_RESOLUTION

  constructor() {
    // 创建图集画布
    const canvas = document.createElement('canvas')
    canvas.width = ATLAS_SIZE * TEXTURE_RESOLUTION
    canvas.height = ATLAS_SIZE * TEXTURE_RESOLUTION
    const ctx = canvas.getContext('2d')!

    // 生成程序化纹理
    this.generateTextures(ctx)

    // UI 直接复用世界中的同一张图集，保证创造物品栏和方块外观一致。
    document.documentElement.style.setProperty(
      '--block-texture-atlas',
      `url("${canvas.toDataURL('image/png')}")`,
    )

    // 创建Three.js纹理
    this.texture = new THREE.CanvasTexture(canvas)
    this.texture.magFilter = THREE.NearestFilter
    this.texture.minFilter = THREE.NearestFilter
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.needsUpdate = true
  }

  /**
   * 获取纹理在图集中的UV坐标
   */
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

  /**
   * 程序化生成所有方块纹理
   */
  private generateTextures(ctx: CanvasRenderingContext2D): void {
    const size = TEXTURE_RESOLUTION
    const atlasPx = ATLAS_SIZE * size

    // 辅助函数：在指定纹理位置绘制
    const draw = (index: number, drawFn: (x: number, y: number, s: number) => void) => {
      const col = index % ATLAS_SIZE
      const row = Math.floor(index / ATLAS_SIZE)
      const ox = col * size
      const oy = row * size
      ctx.save()
      ctx.translate(ox, oy)
      drawFn(0, 0, size)
      ctx.restore()
    }

    // 辅助：填充基础色+噪声
    const fillWithNoise = (baseColor: string, noiseColors: string[], density = 0.3) => {
      return (x: number, y: number, s: number) => {
        ctx.fillStyle = baseColor
        ctx.fillRect(x, y, s, s)
        for (let py = 0; py < s; py++) {
          for (let px = 0; px < s; px++) {
            if (Math.random() < density) {
              ctx.fillStyle = noiseColors[Math.floor(Math.random() * noiseColors.length)]
              ctx.fillRect(x + px, y + py, 1, 1)
            }
          }
        }
      }
    }

    // 0: 保留给AIR（不绘制）

    // 1: 石头
    draw(1, fillWithNoise('#808080', ['#707070', '#909090', '#757575'], 0.4))

    // 2: 泥土
    draw(2, fillWithNoise('#8B5E3C', ['#7A4F30', '#9B6E4C', '#6B4420'], 0.35))

    // 3: 草方块顶部
    draw(3, fillWithNoise('#5D9B37', ['#4D8B27', '#6DAB47', '#3D7B17'], 0.4))

    // 4: 草方块侧面
    draw(4, (x, y, s) => {
      // 上部绿色
      ctx.fillStyle = '#5D9B37'
      ctx.fillRect(x, y, s, 3)
      for (let px = 0; px < s; px++) {
        const h = 2 + Math.floor(Math.random() * 3)
        ctx.fillStyle = '#5D9B37'
        ctx.fillRect(x + px, y, 1, h)
      }
      // 下部泥土
      ctx.fillStyle = '#8B5E3C'
      ctx.fillRect(x, y + 4, s, s - 4)
      for (let py = 4; py < s; py++) {
        for (let px = 0; px < s; px++) {
          if (Math.random() < 0.3) {
            ctx.fillStyle = ['#7A4F30', '#9B6E4C'][Math.floor(Math.random() * 2)]
            ctx.fillRect(x + px, y + py, 1, 1)
          }
        }
      }
    })

    // 5: 基岩
    draw(5, fillWithNoise('#3A3A3A', ['#2A2A2A', '#4A4A4A', '#353535'], 0.5))

    // 6: 圆石
    draw(6, (x, y, s) => {
      ctx.fillStyle = '#7A7A7A'
      ctx.fillRect(x, y, s, s)
      // 石头纹理
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = ['#6A6A6A', '#8A8A8A', '#757575'][Math.floor(Math.random() * 3)]
        const rx = Math.floor(Math.random() * (s - 4))
        const ry = Math.floor(Math.random() * (s - 4))
        ctx.fillRect(x + rx, y + ry, 3 + Math.floor(Math.random() * 3), 3 + Math.floor(Math.random() * 3))
      }
    })

    // 7: 橡木木板
    draw(7, (x, y, s) => {
      ctx.fillStyle = '#BC9862'
      ctx.fillRect(x, y, s, s)
      // 木纹线
      for (let py = 0; py < s; py += 4) {
        ctx.fillStyle = '#A88550'
        ctx.fillRect(x, y + py, s, 1)
      }
      // 噪声
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          if (Math.random() < 0.15) {
            ctx.fillStyle = '#D0AC72'
            ctx.fillRect(x + px, y + py, 1, 1)
          }
        }
      }
    })

    // 8: 橡木原木顶部
    draw(8, (x, y, s) => {
      ctx.fillStyle = '#BC9862'
      ctx.fillRect(x, y, s, s)
      // 年轮
      ctx.strokeStyle = '#A88550'
      ctx.lineWidth = 1
      for (let r = 2; r < s / 2; r += 2) {
        ctx.beginPath()
        ctx.arc(x + s / 2, y + s / 2, r, 0, Math.PI * 2)
        ctx.stroke()
      }
    })

    // 9: 橡木原木侧面
    draw(9, (x, y, s) => {
      ctx.fillStyle = '#6B5030'
      ctx.fillRect(x, y, s, s)
      // 竖向纹理
      for (let px = 0; px < s; px++) {
        if (Math.random() < 0.3) {
          ctx.fillStyle = '#5B4020'
          ctx.fillRect(x + px, y, 1, s)
        }
      }
    })

    // 10: 橡木树叶
    draw(10, fillWithNoise('#3B7A1A', ['#2B6A0A', '#4B8A2A', '#1B5A00'], 0.5))

    // 11: 沙子
    draw(11, fillWithNoise('#E8D5A0', ['#D8C590', '#F8E5B0', '#D0BD90'], 0.3))

    // 12: 砂岩顶部
    draw(12, fillWithNoise('#E8D5A0', ['#D8C590', '#F0DDB0'], 0.2))

    // 13: 砂岩侧面
    draw(13, (x, y, s) => {
      ctx.fillStyle = '#E0CDA0'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#D0BD90'
      ctx.fillRect(x, y, s, 2)
      ctx.fillRect(x, y + s / 2, s, 1)
    })

    // 14: 水
    draw(14, (x, y, s) => {
      ctx.fillStyle = 'rgba(30, 100, 200, 0.7)'
      ctx.fillRect(x, y, s, s)
      for (let py = 0; py < s; py += 2) {
        ctx.fillStyle = 'rgba(50, 120, 220, 0.5)'
        ctx.fillRect(x, y + py, s, 1)
      }
    })

    // 15: 煤矿石
    draw(15, (x, y, s) => {
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      // 煤矿斑点
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#2A2A2A'
        const rx = 2 + Math.floor(Math.random() * (s - 6))
        const ry = 2 + Math.floor(Math.random() * (s - 6))
        ctx.fillRect(x + rx, y + ry, 3, 3)
      }
    })

    // 16: 铁矿石
    draw(16, (x, y, s) => {
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#D4B896'
        const rx = 2 + Math.floor(Math.random() * (s - 5))
        const ry = 2 + Math.floor(Math.random() * (s - 5))
        ctx.fillRect(x + rx, y + ry, 3, 2)
      }
    })

    // 17: 金矿石
    draw(17, (x, y, s) => {
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#FCDB4D'
        const rx = 2 + Math.floor(Math.random() * (s - 5))
        const ry = 2 + Math.floor(Math.random() * (s - 5))
        ctx.fillRect(x + rx, y + ry, 3, 2)
      }
    })

    // 18: 钻石矿石
    draw(18, (x, y, s) => {
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#5DECF0'
        const rx = 2 + Math.floor(Math.random() * (s - 5))
        const ry = 2 + Math.floor(Math.random() * (s - 5))
        ctx.fillRect(x + rx, y + ry, 3, 2)
      }
    })

    // 19: 沙砾
    draw(19, fillWithNoise('#8A7A7A', ['#7A6A6A', '#9A8A8A', '#6A5A5A'], 0.4))

    // 20: 粘土
    draw(20, fillWithNoise('#9DA4AE', ['#8D949E', '#ADB4BE'], 0.2))

    // 21: 工作台顶部
    draw(21, (x, y, s) => {
      ctx.fillStyle = '#BC9862'
      ctx.fillRect(x, y, s, s)
      // 网格线
      ctx.strokeStyle = '#6B5030'
      ctx.lineWidth = 1
      for (let i = 0; i <= 3; i++) {
        const p = (i / 3) * s
        ctx.beginPath()
        ctx.moveTo(x + p, y)
        ctx.lineTo(x + p, y + s)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y + p)
        ctx.lineTo(x + s, y + p)
        ctx.stroke()
      }
    })

    // 22: 工作台侧面
    draw(22, (x, y, s) => {
      ctx.fillStyle = '#BC9862'
      ctx.fillRect(x, y, s, s)
      // 工具图案
      ctx.fillStyle = '#808080'
      ctx.fillRect(x + 3, y + 2, 2, 8)
      ctx.fillRect(x + 8, y + 4, 3, 6)
    })

    // 23: 熔炉侧面
    draw(23, (x, y, s) => {
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      // 熔炉口
      ctx.fillStyle = '#3A3A3A'
      ctx.fillRect(x + 4, y + 5, 8, 7)
      ctx.fillStyle = '#6A4A2A'
      ctx.fillRect(x + 5, y + 8, 6, 3)
    })

    // 30-42: Nether blocks
    draw(30, fillWithNoise('#8B3030', ['#7B2020', '#9B4040', '#6B1010'], 0.4)) // Netherrack
    draw(31, fillWithNoise('#5B4030', ['#4B3020', '#6B5040'], 0.3)) // Soul Sand
    draw(32, fillWithNoise('#4B3828', ['#3B2818', '#5B4838'], 0.3)) // Soul Soil
    draw(33, fillWithNoise('#4A4A50', ['#3A3A40', '#5A5A60'], 0.3)) // Basalt top
    draw(34, (x, y, s) => { // Basalt side
      ctx.fillStyle = '#4A4A50'
      ctx.fillRect(x, y, s, s)
      for (let px = 0; px < s; px += 3) {
        ctx.fillStyle = '#3A3A40'
        ctx.fillRect(x + px, y, 1, s)
      }
    })
    draw(35, fillWithNoise('#2A2A30', ['#1A1A20', '#3A3A40'], 0.3)) // Blackstone
    draw(36, fillWithNoise('#8B2020', ['#7B1010', '#9B3030'], 0.4)) // Crimson Nylium top
    draw(37, (x, y, s) => { // Crimson side
      ctx.fillStyle = '#8B2020'
      ctx.fillRect(x, y, s, 3)
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y + 3, s, s - 3)
    })
    draw(38, fillWithNoise('#20808B', ['#10707B', '#30909B'], 0.4)) // Warped Nylium top
    draw(39, (x, y, s) => { // Warped side
      ctx.fillStyle = '#20808B'
      ctx.fillRect(x, y, s, 3)
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y + 3, s, s - 3)
    })
    draw(40, (x, y, s) => { // Magma
      ctx.fillStyle = '#8B3030'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#FCDB4D'
      for (let i = 0; i < 4; i++) {
        const rx = Math.floor(Math.random() * (s - 4))
        const ry = Math.floor(Math.random() * (s - 4))
        ctx.fillRect(x + rx, y + ry, 3, 3)
      }
    })
    draw(41, (x, y, s) => { // Glowstone
      ctx.fillStyle = '#FCDB8D'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = ['#FCEB9D', '#DCBB6D', '#ECCB7D'][Math.floor(Math.random() * 3)]
        const rx = Math.floor(Math.random() * (s - 4))
        const ry = Math.floor(Math.random() * (s - 4))
        ctx.fillRect(x + rx, y + ry, 4, 4)
      }
    })
    draw(42, (x, y, s) => { // Nether Bricks
      ctx.fillStyle = '#2A1520'
      ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = '#1A0510'
      ctx.lineWidth = 1
      for (let py = 0; py < s; py += 4) {
        ctx.beginPath(); ctx.moveTo(x, y + py); ctx.lineTo(x + s, y + py); ctx.stroke()
      }
      for (let px = 0; px < s; px += 8) {
        ctx.beginPath(); ctx.moveTo(x + px, y); ctx.lineTo(x + px, y + s); ctx.stroke()
      }
    })

    // 50-52: End blocks
    draw(50, fillWithNoise('#D8D8A0', ['#C8C890', '#E8E8B0', '#D0D098'], 0.3)) // End Stone
    draw(51, fillWithNoise('#1A0A2A', ['#0A0020', '#2A1A3A', '#100525'], 0.3)) // Obsidian
    draw(52, fillWithNoise('#A070B0', ['#9060A0', '#B080C0'], 0.3)) // Purpur

    // 60-64: Building blocks
    draw(60, (x, y, s) => { // Stone Bricks
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = '#6A6A6A'
      ctx.lineWidth = 1
      for (let py = 0; py < s; py += 4) {
        ctx.beginPath(); ctx.moveTo(x, y + py); ctx.lineTo(x + s, y + py); ctx.stroke()
        const offset = (py % 8 === 0) ? 0 : 4
        for (let px = offset; px < s; px += 8) {
          ctx.beginPath(); ctx.moveTo(x + px, y + py); ctx.lineTo(x + px, y + py + 4); ctx.stroke()
        }
      }
    })
    draw(61, (x, y, s) => { // Mossy Stone Bricks
      ctx.fillStyle = '#708070'
      ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = '#5A6A5A'
      ctx.lineWidth = 1
      for (let py = 0; py < s; py += 4) {
        ctx.beginPath(); ctx.moveTo(x, y + py); ctx.lineTo(x + s, y + py); ctx.stroke()
      }
    })
    draw(62, (x, y, s) => { // Bricks
      ctx.fillStyle = '#9B5B4B'
      ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = '#C8B8A0'
      ctx.lineWidth = 1
      for (let py = 0; py < s; py += 4) {
        ctx.beginPath(); ctx.moveTo(x, y + py); ctx.lineTo(x + s, y + py); ctx.stroke()
        const offset = (py % 8 === 0) ? 0 : 4
        for (let px = offset; px < s; px += 8) {
          ctx.beginPath(); ctx.moveTo(x + px, y + py); ctx.lineTo(x + px, y + py + 4); ctx.stroke()
        }
      }
    })
    draw(63, (x, y, s) => { // Bookshelf side
      ctx.fillStyle = '#BC9862'
      ctx.fillRect(x, y, s, s)
      const bookColors = ['#8B2020', '#20408B', '#208B40', '#8B8020', '#6B2060']
      for (let row = 0; row < 3; row++) {
        const by = 1 + row * 5
        ctx.fillStyle = '#BC9862'
        ctx.fillRect(x, by, s, 4)
        for (let bx = 1; bx < s - 1; bx += 2) {
          ctx.fillStyle = bookColors[Math.floor(Math.random() * bookColors.length)]
          ctx.fillRect(x + bx, by + 1, 1, 3)
        }
      }
    })
    draw(64, (x, y, s) => { // Glass
      ctx.fillStyle = 'rgba(200, 220, 255, 0.3)'
      ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = 'rgba(180, 200, 240, 0.6)'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 1, y + 1, s - 2, s - 2)
      ctx.strokeStyle = 'rgba(200, 220, 255, 0.4)'
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y); ctx.stroke()
    })

    // 70-73: Mineral blocks
    draw(70, (x, y, s) => { // Iron Block
      ctx.fillStyle = '#D8D8D8'
      ctx.fillRect(x, y, s, s)
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          if (Math.random() < 0.1) {
            ctx.fillStyle = '#C0C0C0'
            ctx.fillRect(x + px, y + py, 1, 1)
          }
        }
      }
    })
    draw(71, (x, y, s) => { // Gold Block
      ctx.fillStyle = '#FCDB4D'
      ctx.fillRect(x, y, s, s)
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          if (Math.random() < 0.1) {
            ctx.fillStyle = '#ECCB3D'
            ctx.fillRect(x + px, y + py, 1, 1)
          }
        }
      }
    })
    draw(72, (x, y, s) => { // Diamond Block
      ctx.fillStyle = '#5DECF0'
      ctx.fillRect(x, y, s, s)
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          if (Math.random() < 0.1) {
            ctx.fillStyle = '#4DDCE0'
            ctx.fillRect(x + px, y + py, 1, 1)
          }
        }
      }
    })
    draw(73, (x, y, s) => { // Netherite Block
      ctx.fillStyle = '#3A3238'
      ctx.fillRect(x, y, s, s)
      for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
          if (Math.random() < 0.1) {
            ctx.fillStyle = '#2A2228'
            ctx.fillRect(x + px, y + py, 1, 1)
          }
        }
      }
    })

    // 80: Chest
    draw(80, (x, y, s) => {
      ctx.fillStyle = '#A07030'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#6B5030'
      ctx.fillRect(x, y + s / 2 - 1, s, 2)
      ctx.fillStyle = '#FCDB4D'
      ctx.fillRect(x + s / 2 - 1, y + s / 2 - 2, 2, 4)
    })

    // 81: Spawner
    draw(81, (x, y, s) => {
      ctx.fillStyle = '#3A3A3A'
      ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = '#5A5A5A'
      ctx.lineWidth = 1
      for (let i = 0; i < 4; i++) {
        const rx = Math.floor(Math.random() * (s - 4))
        const ry = Math.floor(Math.random() * (s - 4))
        ctx.strokeRect(x + rx, y + ry, 3, 3)
      }
    })

    // === 82-84: TNT ===
    draw(82, (x, y, s) => { // TNT top
      ctx.fillStyle = '#C84040'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#A03030'
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + Math.random() * s, y + Math.random() * s, 3, 3)
      }
    })
    draw(83, (x, y, s) => { // TNT bottom
      ctx.fillStyle = '#A03030'
      ctx.fillRect(x, y, s, s)
    })
    draw(84, (x, y, s) => { // TNT side
      ctx.fillStyle = '#C84040'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#E8E8E8'
      ctx.fillRect(x + 2, y + 4, s - 4, s - 8)
      ctx.fillStyle = '#000'
      ctx.font = '6px monospace'
      ctx.fillText('TNT', x + 3, y + 10)
    })

    // === 85-92: Stone variants ===
    draw(85, fillWithNoise('#9B6B5A', ['#8B5B4A', '#AB7B6A'], 0.3)) // Granite
    draw(86, fillWithNoise('#A07060', ['#907050', '#B08070'], 0.2)) // Polished Granite
    draw(87, fillWithNoise('#C8C0B8', ['#B8B0A8', '#D8D0C8'], 0.3)) // Diorite
    draw(88, fillWithNoise('#D0C8C0', ['#C0B8B0', '#E0D8D0'], 0.2)) // Polished Diorite
    draw(89, fillWithNoise('#8A8A8A', ['#7A7A7A', '#9A9A9A'], 0.3)) // Andesite
    draw(90, fillWithNoise('#909090', ['#808080', '#A0A0A0'], 0.2)) // Polished Andesite
    draw(91, fillWithNoise('#909090', ['#808080', '#A0A0A0'], 0.15)) // Smooth Stone
    draw(92, (x, y, s) => { // Mossy Cobblestone
      ctx.fillStyle = '#7A7A7A'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = ['#6A8A6A', '#5A7A5A'][Math.floor(Math.random() * 2)]
        const rx = Math.floor(Math.random() * (s - 4))
        const ry = Math.floor(Math.random() * (s - 4))
        ctx.fillRect(x + rx, y + ry, 3 + Math.floor(Math.random() * 3), 3 + Math.floor(Math.random() * 3))
      }
    })

    // === 93-107: Wood variants ===
    draw(93, (x, y, s) => { // Spruce log side
      ctx.fillStyle = '#3B2810'
      ctx.fillRect(x, y, s, s)
      for (let px = 0; px < s; px++) {
        if (Math.random() < 0.3) {
          ctx.fillStyle = '#2B1800'
          ctx.fillRect(x + px, y, 1, s)
        }
      }
    })
    draw(94, fillWithNoise('#6B5030', ['#5B4020', '#7B6040'], 0.15)) // Spruce planks
    draw(95, fillWithNoise('#2B5A1A', ['#1B4A0A', '#3B6A2A'], 0.5)) // Spruce leaves
    draw(96, (x, y, s) => { // Birch log side
      ctx.fillStyle = '#D8D0C0'
      ctx.fillRect(x, y, s, s)
      for (let py = 0; py < s; py += 4) {
        if (Math.random() < 0.5) {
          ctx.fillStyle = '#3A3A3A'
          ctx.fillRect(x, y + py, s, 1)
        }
      }
    })
    draw(97, fillWithNoise('#D8D0B0', ['#C8C0A0', '#E8E0C0'], 0.15)) // Birch planks
    draw(98, fillWithNoise('#4B8A2A', ['#3B7A1A', '#5B9A3A'], 0.5)) // Birch leaves
    draw(99, (x, y, s) => { // Jungle log side
      ctx.fillStyle = '#6B5030'
      ctx.fillRect(x, y, s, s)
      for (let py = 0; py < s; py += 3) {
        ctx.fillStyle = '#5B4020'
        ctx.fillRect(x, y + py, s, 1)
      }
    })
    draw(100, fillWithNoise('#A07050', ['#906040', '#B08060'], 0.15)) // Jungle planks
    draw(101, fillWithNoise('#2B7A1A', ['#1B6A0A', '#3B8A2A'], 0.5)) // Jungle leaves
    draw(102, (x, y, s) => { // Acacia log side
      ctx.fillStyle = '#5A5050'
      ctx.fillRect(x, y, s, s)
      for (let px = 0; px < s; px++) {
        if (Math.random() < 0.2) {
          ctx.fillStyle = '#4A4040'
          ctx.fillRect(x + px, y, 1, s)
        }
      }
    })
    draw(103, fillWithNoise('#B06030', ['#A05020', '#C07040'], 0.15)) // Acacia planks
    draw(104, fillWithNoise('#3B7A2A', ['#2B6A1A', '#4B8A3A'], 0.5)) // Acacia leaves
    draw(105, (x, y, s) => { // Dark oak log side
      ctx.fillStyle = '#3A2810'
      ctx.fillRect(x, y, s, s)
      for (let px = 0; px < s; px++) {
        if (Math.random() < 0.3) {
          ctx.fillStyle = '#2A1800'
          ctx.fillRect(x + px, y, 1, s)
        }
      }
    })
    draw(106, fillWithNoise('#4B3020', ['#3B2010', '#5B4030'], 0.15)) // Dark oak planks
    draw(107, fillWithNoise('#2B5A0A', ['#1B4A00', '#3B6A1A'], 0.5)) // Dark oak leaves

    // === 108-116: Ores ===
    draw(108, (x, y, s) => { // Emerald ore
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#40C040'
        const rx = 2 + Math.floor(Math.random() * (s - 5))
        const ry = 2 + Math.floor(Math.random() * (s - 5))
        ctx.fillRect(x + rx, y + ry, 3, 2)
      }
    })
    draw(109, (x, y, s) => { // Redstone ore
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#E02020'
        const rx = 2 + Math.floor(Math.random() * (s - 5))
        const ry = 2 + Math.floor(Math.random() * (s - 5))
        ctx.fillRect(x + rx, y + ry, 2, 2)
      }
    })
    draw(110, (x, y, s) => { // Lapis ore
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#2040E0'
        const rx = 2 + Math.floor(Math.random() * (s - 5))
        const ry = 2 + Math.floor(Math.random() * (s - 5))
        ctx.fillRect(x + rx, y + ry, 2, 2)
      }
    })
    draw(111, (x, y, s) => { // Copper ore
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#C07040'
        const rx = 2 + Math.floor(Math.random() * (s - 5))
        const ry = 2 + Math.floor(Math.random() * (s - 5))
        ctx.fillRect(x + rx, y + ry, 3, 2)
      }
    })
    draw(112, fillWithNoise('#3A3A40', ['#2A2A30', '#4A4A50'], 0.3)) // Deepslate
    draw(113, fillWithNoise('#C07040', ['#B06030', '#D08050'], 0.2)) // Copper block
    draw(114, fillWithNoise('#40C040', ['#30B030', '#50D050'], 0.2)) // Emerald block
    draw(115, fillWithNoise('#2040E0', ['#1030D0', '#3050F0'], 0.2)) // Lapis block
    draw(116, fillWithNoise('#E02020', ['#D01010', '#F03030'], 0.2)) // Redstone block

    // === 117-132: Wool colors ===
    const woolColors = [
      '#E8E8E8', '#E08040', '#B040C0', '#6090E0', '#E0D040', '#60D040',
      '#E070A0', '#505050', '#A0A0A0', '#3090A0', '#8040B0', '#3040B0',
      '#704020', '#407020', '#A03030', '#1A1A1A'
    ]
    woolColors.forEach((color, i) => {
      draw(117 + i, fillWithNoise(color, [color, color], 0.2))
    })

    // === 133-146: Concrete colors ===
    const concreteColors = [
      '#C8C8C8', '#C06820', '#A030A0', '#4070C0', '#C0B020', '#50B030',
      '#C06080', '#404040', '#808080', '#2080A0', '#6030A0', '#2030A0',
      '#603010', '#306010', '#801010', '#101010'
    ]
    concreteColors.forEach((color, i) => {
      draw(133 + i, fillWithNoise(color, [color, color], 0.1))
    })

    // === 147: Terracotta ===
    draw(147, fillWithNoise('#A0705A', ['#90604A', '#B0806A'], 0.2))

    // === 148-149: Red sand/sandstone ===
    draw(148, fillWithNoise('#C06030', ['#B05020', '#D07040'], 0.3)) // Red sand
    draw(149, fillWithNoise('#C06030', ['#B05020', '#D07040'], 0.2)) // Red sandstone

    // === 150: Red Nether Bricks ===
    draw(150, (x, y, s) => {
      ctx.fillStyle = '#6B1010'
      ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = '#4B0000'
      ctx.lineWidth = 1
      for (let py = 0; py < s; py += 4) {
        ctx.beginPath(); ctx.moveTo(x, y + py); ctx.lineTo(x + s, y + py); ctx.stroke()
      }
    })

    // === 151-153: Nether ores and quartz ===
    draw(151, (x, y, s) => { // Nether gold ore
      ctx.fillStyle = '#8B3030'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#FCDB4D'
        const rx = 2 + Math.floor(Math.random() * (s - 5))
        const ry = 2 + Math.floor(Math.random() * (s - 5))
        ctx.fillRect(x + rx, y + ry, 2, 2)
      }
    })
    draw(152, (x, y, s) => { // Nether quartz ore
      ctx.fillStyle = '#8B3030'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#E8E8D8'
        const rx = 2 + Math.floor(Math.random() * (s - 5))
        const ry = 2 + Math.floor(Math.random() * (s - 5))
        ctx.fillRect(x + rx, y + ry, 3, 2)
      }
    })
    draw(153, fillWithNoise('#E8E0D0', ['#D8D0C0', '#F8F0E0'], 0.15)) // Quartz block

    // === 154-155: End variants ===
    draw(154, (x, y, s) => { // End stone bricks
      ctx.fillStyle = '#D8D8A0'
      ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = '#B8B880'
      ctx.lineWidth = 1
      for (let py = 0; py < s; py += 4) {
        ctx.beginPath(); ctx.moveTo(x, y + py); ctx.lineTo(x + s, y + py); ctx.stroke()
        const offset = (py % 8 === 0) ? 0 : 4
        for (let px = offset; px < s; px += 8) {
          ctx.beginPath(); ctx.moveTo(x + px, y + py); ctx.lineTo(x + px, y + py + 4); ctx.stroke()
        }
      }
    })
    draw(155, (x, y, s) => { // Crying obsidian
      ctx.fillStyle = '#1A0A2A'
      ctx.fillRect(x, y, s, s)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#6030C0'
        const rx = Math.floor(Math.random() * (s - 3))
        const ry = Math.floor(Math.random() * (s - 3))
        ctx.fillRect(x + rx, y + ry, 2, 3)
      }
    })

    // === 156-169: Utility blocks ===
    draw(156, (x, y, s) => { // Anvil
      ctx.fillStyle = '#4A4A4A'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#3A3A3A'
      ctx.fillRect(x + 2, y + 2, s - 4, 4)
    })
    draw(157, (x, y, s) => { // Grindstone
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#606060'
      ctx.fillRect(x + 4, y + 2, 8, 12)
    })
    draw(158, fillWithNoise('#808080', ['#707070', '#909090'], 0.3)) // Stonecutter
    draw(159, fillWithNoise('#BC9862', ['#AC8852', '#CCA872'], 0.15)) // Loom
    draw(160, fillWithNoise('#BC9862', ['#AC8852', '#CCA872'], 0.15)) // Cartography table
    draw(161, fillWithNoise('#BC9862', ['#AC8852', '#CCA872'], 0.15)) // Fletching table
    draw(162, fillWithNoise('#4A4A4A', ['#3A3A3A', '#5A5A5A'], 0.2)) // Smithing table
    draw(163, (x, y, s) => { // Blast furnace
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#C06030'
      ctx.fillRect(x + 4, y + 5, 8, 7)
    })
    draw(164, (x, y, s) => { // Smoker
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#4A3020'
      ctx.fillRect(x + 4, y + 5, 8, 7)
    })
    draw(165, fillWithNoise('#6B5030', ['#5B4020', '#7B6040'], 0.3)) // Composter
    draw(166, fillWithNoise('#A07030', ['#907020', '#B08040'], 0.2)) // Barrel
    draw(167, (x, y, s) => { // Bell
      ctx.fillStyle = '#C0A040'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#A08030'
      ctx.fillRect(x + 4, y + 2, 8, 12)
    })
    draw(168, fillWithNoise('#BC9862', ['#AC8852', '#CCA872'], 0.15)) // Lectern
    draw(169, (x, y, s) => { // Beacon
      ctx.fillStyle = '#4060C0'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#80A0E0'
      ctx.fillRect(x + 4, y + 4, 8, 8)
    })

    // === 170-173: Ice and snow ===
    draw(170, fillWithNoise('#80B0E0', ['#70A0D0', '#90C0F0'], 0.15)) // Ice
    draw(171, fillWithNoise('#90C0E0', ['#80B0D0', '#A0D0F0'], 0.1)) // Packed ice
    draw(172, fillWithNoise('#4080D0', ['#3070C0', '#5090E0'], 0.1)) // Blue ice
    draw(173, fillWithNoise('#F0F0F0', ['#E0E0E0', '#FFFFFF'], 0.2)) // Snow

    // === 174-181: Plants ===
    draw(174, (x, y, s) => { // Cactus
      ctx.fillStyle = '#30802A'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#20601A'
      for (let py = 0; py < s; py += 3) {
        ctx.fillRect(x, y + py, s, 1)
      }
    })
    draw(175, (x, y, s) => { // Sugar cane
      ctx.fillStyle = '#80C040'
      ctx.fillRect(x, y, s, s)
      for (let py = 0; py < s; py += 4) {
        ctx.fillStyle = '#60A030'
        ctx.fillRect(x, y + py, s, 1)
      }
    })
    draw(176, (x, y, s) => { // Pumpkin
      ctx.fillStyle = '#D08020'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#A06010'
      for (let px = 0; px < s; px += 4) {
        ctx.fillRect(x + px, y, 2, s)
      }
    })
    draw(177, (x, y, s) => { // Melon
      ctx.fillStyle = '#60A030'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#408020'
      for (let px = 0; px < s; px += 4) {
        ctx.fillRect(x + px, y, 2, s)
      }
    })
    draw(178, fillWithNoise('#C0A040', ['#B09030', '#D0B050'], 0.2)) // Hay bale
    draw(179, fillWithNoise('#E0E0C0', ['#D0D0B0', '#F0F0D0'], 0.2)) // Bone block
    draw(180, fillWithNoise('#204020', ['#103010', '#305030'], 0.3)) // Dried kelp block
    draw(181, fillWithNoise('#80C040', ['#70B030', '#90D050'], 0.2)) // Bamboo block

    // === 182-185: Prismarine ===
    draw(182, fillWithNoise('#609080', ['#508070', '#70A090'], 0.3)) // Prismarine
    draw(183, (x, y, s) => { // Prismarine bricks
      ctx.fillStyle = '#609080'
      ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = '#407060'
      ctx.lineWidth = 1
      for (let py = 0; py < s; py += 4) {
        ctx.beginPath(); ctx.moveTo(x, y + py); ctx.lineTo(x + s, y + py); ctx.stroke()
      }
    })
    draw(184, fillWithNoise('#304830', ['#203820', '#405840'], 0.3)) // Dark prismarine
    draw(185, (x, y, s) => { // Sea lantern
      ctx.fillStyle = '#A0D0D0'
      ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#C0F0F0'
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + Math.random() * s, y + Math.random() * s, 3, 3)
      }
    })

    // === 186-189: Mushroom blocks ===
    draw(186, fillWithNoise('#C0B090', ['#B0A080', '#D0C0A0'], 0.2)) // Mushroom stem
    draw(187, fillWithNoise('#C03030', ['#B02020', '#D04040'], 0.3)) // Red mushroom block
    draw(188, fillWithNoise('#806040', ['#705030', '#907050'], 0.3)) // Brown mushroom block
    draw(189, (x, y, s) => { // Mycelium
      ctx.fillStyle = '#603040'
      ctx.fillRect(x, y, s, 4)
      ctx.fillStyle = '#8B5E3C'
      ctx.fillRect(x, y + 4, s, s - 4)
    })

    // === 190-195: Rails and torches ===
    draw(190, (x, y, s) => { // Rail
      ctx.fillStyle = '#808080'
      ctx.fillRect(x + 2, y, 2, s)
      ctx.fillRect(x + s - 4, y, 2, s)
      ctx.fillStyle = '#606060'
      for (let py = 0; py < s; py += 4) {
        ctx.fillRect(x + 2, y + py, s - 4, 1)
      }
    })
    draw(191, (x, y, s) => { // Torch
      ctx.fillStyle = '#806030'
      ctx.fillRect(x + 6, y + 4, 4, 12)
      ctx.fillStyle = '#F0C030'
      ctx.fillRect(x + 5, y + 1, 6, 5)
    })
    draw(192, (x, y, s) => { // Soul torch
      ctx.fillStyle = '#806030'
      ctx.fillRect(x + 6, y + 4, 4, 12)
      ctx.fillStyle = '#40C0C0'
      ctx.fillRect(x + 5, y + 1, 6, 5)
    })
    draw(193, (x, y, s) => { // Lantern
      ctx.fillStyle = '#606060'
      ctx.fillRect(x + 3, y + 2, 10, 12)
      ctx.fillStyle = '#F0C030'
      ctx.fillRect(x + 5, y + 4, 6, 8)
    })
    draw(194, (x, y, s) => { // Soul lantern
      ctx.fillStyle = '#606060'
      ctx.fillRect(x + 3, y + 2, 10, 12)
      ctx.fillStyle = '#40C0C0'
      ctx.fillRect(x + 5, y + 4, 6, 8)
    })
    draw(195, (x, y, s) => { // Chain
      ctx.fillStyle = '#606060'
      ctx.fillRect(x + 6, y, 4, s)
      ctx.fillStyle = '#404040'
      for (let py = 0; py < s; py += 4) {
        ctx.fillRect(x + 6, y + py, 4, 2)
      }
    })

    // === 196-203: Redstone components ===
    draw(196, (x, y, s) => { // Redstone dust
      ctx.fillStyle = '#6b1010'; ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = '#f02a20'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(x + 1, y + s / 2); ctx.lineTo(x + s - 1, y + s / 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x + s / 2, y + 1); ctx.lineTo(x + s / 2, y + s - 1); ctx.stroke()
    })
    draw(197, (x, y, s) => { // Piston face
      ctx.fillStyle = '#b5965a'; ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = '#5b4930'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, s - 4, s - 4)
      ctx.fillStyle = '#8c713e'; ctx.fillRect(x + 6, y + 6, 4, 4)
    })
    draw(198, (x, y, s) => { // Piston side
      ctx.fillStyle = '#737373'; ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#a98245'; ctx.fillRect(x + 1, y + 3, s - 2, 6)
      ctx.fillStyle = '#4a4a4a'; ctx.fillRect(x + 6, y + 9, 4, 7)
    })
    draw(199, (x, y, s) => { // Sticky piston face
      ctx.fillStyle = '#79a84f'; ctx.fillRect(x, y, s, s)
      ctx.strokeStyle = '#405f2c'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, s - 4, s - 4)
      ctx.fillStyle = '#a9cb66'; ctx.fillRect(x + 6, y + 6, 4, 4)
    })
    draw(200, (x, y, s) => { // Repeater
      ctx.fillStyle = '#d7d3c9'; ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#b51d18'; ctx.fillRect(x + 3, y + 3, 2, 3); ctx.fillRect(x + 11, y + 10, 2, 3)
      ctx.strokeStyle = '#99130f'; ctx.beginPath(); ctx.moveTo(x + 4, y + 8); ctx.lineTo(x + 12, y + 8); ctx.stroke()
    })
    draw(201, (x, y, s) => { // Comparator
      ctx.fillStyle = '#d7d3c9'; ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#b51d18'; ctx.fillRect(x + 7, y + 3, 2, 3); ctx.fillRect(x + 3, y + 10, 2, 3); ctx.fillRect(x + 11, y + 10, 2, 3)
      ctx.strokeStyle = '#99130f'; ctx.beginPath(); ctx.moveTo(x + 4, y + 11); ctx.lineTo(x + 8, y + 5); ctx.lineTo(x + 12, y + 11); ctx.stroke()
    })
    draw(202, (x, y, s) => { // Observer
      ctx.fillStyle = '#777'; ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#393939'; ctx.fillRect(x + 3, y + 5, 4, 4); ctx.fillRect(x + 10, y + 5, 3, 4)
      ctx.fillStyle = '#d22a22'; ctx.fillRect(x + 6, y + 12, 4, 2)
    })
    draw(203, (x, y, s) => { // Hopper
      ctx.fillStyle = '#4f555b'; ctx.fillRect(x, y, s, s)
      ctx.fillStyle = '#22272b'; ctx.fillRect(x + 2, y + 2, s - 4, 4)
      ctx.fillStyle = '#707981'; ctx.fillRect(x + 4, y + 7, s - 8, 4); ctx.fillRect(x + 6, y + 11, 4, 5)
    })
  }

  dispose(): void {
    this.texture.dispose()
  }
}
