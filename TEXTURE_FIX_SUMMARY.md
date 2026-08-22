# 方块贴图修复总结

## 问题
方块放置后显示的是程序生成的假贴图，而不是从 Minecraft 官网下载的真实贴图。

## 根本原因
虽然项目已有完整的官方贴图烘焙系统（`scripts/build-texture-atlas.mjs`），但运行时代码（`TextureAtlas.ts`）只使用程序生成的纹理，从未加载官方贴图图集（`block-atlas.png`）。

## 修复方案

### 修改的文件

#### 1. `src/rendering/TextureAtlas.ts`
在构造函数中添加了官方图集加载逻辑：

```typescript
// 导入官方图集
import blockAtlasUrl from '@/assets/textures/block-atlas.png'

constructor() {
  // 1. 先生成程序纹理作为后备
  this.generateTextures(ctx)
  // ...
  
  // 2. 异步加载官方 Minecraft 贴图图集，覆盖程序纹理
  this.loadOfficialAtlas(ctx, canvas)
}

private loadOfficialAtlas(ctx, canvas) {
  const img = new Image()
  img.onload = () => {
    // 将官方贴图绘制到 canvas 上，覆盖程序纹理
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    // 更新 THREE 纹理和 CSS 变量
    this.texture.needsUpdate = true
    // 更新 CSS 变量...
  }
  img.src = blockAtlasUrl
}
```

**工作流程：**
1. 启动时立即显示程序纹理（作为后备）
2. 异步加载 `block-atlas.png`（130KB）
3. 加载完成后将官方贴图绘制到 canvas 上，覆盖对应的程序纹理
4. 更新 Three.js 纹理和 CSS 变量

#### 2. `src/assets/textures/block-atlas.png`（重新烘焙）
运行 `node scripts/build-texture-atlas.mjs` 重新生成图集：
- 解析了 291 个方块
- 196 个图集索引使用官方贴图
- 248 个方块完全覆盖
- 只有 2 个方块（HOPPER、REPEAT_COMMAND_BLOCK）使用程序纹理作为后备

## 之前的修复（上一轮）
同时修复了以下问题：

1. **混凝土颜色数组** - 添加了缺失的淡灰色，修正了颜色顺序
2. **彩色陶瓦贴图** - 16种颜色各有独立贴图（索引223-238）
3. **彩色染色玻璃贴图** - 16种颜色各有独立贴图（索引239-254）
4. **贴图索引冲突** - 解决了混凝土与陶瓦/红沙的索引重叠

## 验证结果
- ✅ TypeScript 编译通过
- ✅ Vite 构建成功（1.48s）
- ✅ 官方图集重新烘焙（130.6 KB）
- ✅ 248/291 个方块使用真实官方贴图

## 技术细节
- 官方图集大小：512×512 PNG（16×16 网格，每格 32×32）
- 贴图来源：minecraft.wiki（通过 `scripts/build-texture-atlas.mjs` 下载）
- 本地缓存：`scripts/texture-cache/`（183 个 PNG 文件）
- 后备机制：未覆盖的方块自动使用程序纹理

## 如何重新烘焙图集
```bash
cd my-world
node scripts/build-texture-atlas.mjs
```

这会从 `scripts/texture-cache/` 读取缓存的官方贴图，缺失的贴图会从 minecraft.wiki 自动下载。
