<template>
  <div class="game-container">
    <MinecraftRenderer
      @block-click="handleBlockClick"
      @scene-ready="handleSceneReady"
      @register-listener="handleRegisterListener"
    />
    <div v-if="!sceneReady" class="loading-overlay">
      <div class="loading-text">正在加载世界...</div>
    </div>
    <div class="controls-panel">
      <h3>游戏控制</h3>
      <p>左键: 破坏方块</p>
      <p>右键: 放置方块</p>
      <p>WASD: 移动</p>
      <p>空格: 跳跃</p>
      <p>鼠标: 视角</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue';
import * as THREE from 'three';
import MinecraftRenderer from './MinecraftRenderer.vue';
import type { Block, BlockType, GameConfig, PlayerState } from '../types/game';
import { positionToKey, clamp, random } from '../utils/gameUtils';

// 游戏状态
const sceneReady = ref(false);
const blocks = ref(new Map<string, Block>());
const selectedBlockType = ref(0);

// 方块类型定义
const blockTypes: BlockType[] = [
  { name: '草地', color: 0x4CAF50 },
  { name: '泥土', color: 0x8D6E63 },
  { name: '石头', color: 0x9E9E9E },
  { name: '沙子', color: 0xFFC107 },
  { name: '木头', color: 0xA1887F },
  { name: '树叶', color: 0x66BB6A, transparent: true, opacity: 0.7 }
];

// 游戏配置
const config: GameConfig = {
  gravity: 0.08,
  speed: 0.2,
  jumpHeight: 0.3,
  blockSize: 1
};

// 玩家状态 - 使用非响应式变量
let player: PlayerState = {
  position: new THREE.Vector3(0, 10, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  canJump: false
};

// 计算属性，让玩家位置能被Vue响应式监听
const playerPosition = computed(() => player.position);

// 键盘控制状态 - 使用非响应式对象
interface Keys {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

let keys: Keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false
};

// 创建方块
const createBlock = (x: number, y: number, z: number, typeIndex: number): Block => {
  // 确保blockType有值
  let safeBlockType = blockTypes[typeIndex];
  if (!safeBlockType && blockTypes.length > 0) {
    safeBlockType = blockTypes[0];
  }
  // 如果仍然没有blockType，创建一个默认的
  if (!safeBlockType) {
    safeBlockType = { name: '默认方块', color: 0x808080 };
  }
  
  const geometry = new THREE.BoxGeometry(config.blockSize, config.blockSize, config.blockSize);
  const material = new THREE.MeshStandardMaterial({
    color: safeBlockType.color,
    transparent: safeBlockType.transparent || false,
    opacity: safeBlockType.opacity || 1
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  // 禁用阴影以避免Vue响应式代理问题
  // mesh.castShadow = true;
  // mesh.receiveShadow = true;
  
  return {
    mesh,
    type: typeIndex
  };
};

// 生成世界
const generateWorld = () => {
  const radius = 10; // 世界半径
  
  // 生成地形
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      // 生成简单的地形高度
      const height = Math.floor(Math.sin(x * 0.5) * 3 + Math.cos(z * 0.5) * 3 + 5);
      
      // 生成不同层的方块
      for (let y = 0; y <= height; y++) {
        let blockType = 1; // 泥土
        
        if (y === height) {
          blockType = 0; // 草地
        } else if (y < height - 2) {
          blockType = 2; // 石头
        }
        
        const block = createBlock(x, y, z, blockType);
        const key = positionToKey({ x, y, z });
        blocks.value.set(key, block);
      }
    }
  }
  
  // 添加一些随机树木
  for (let i = 0; i < 5; i++) {
    const treeX = Math.floor(random(-radius + 3, radius - 3));
    const treeZ = Math.floor(random(-radius + 3, radius - 3));
    
    // 找到树的高度位置
    let maxY = -1;
    for (let y = 10; y >= 0; y--) {
      const key = positionToKey({ x: treeX, y, z: treeZ });
      if (blocks.value.has(key)) {
        maxY = y;
        break;
      }
    }
    
    if (maxY >= 0) {
      // 树干
      const trunkHeight = Math.floor(random(3, 5));
      for (let y = 1; y <= trunkHeight; y++) {
        const block = createBlock(treeX, maxY + y, treeZ, 4); // 木头
        const key = positionToKey({ x: treeX, y: maxY + y, z: treeZ });
        blocks.value.set(key, block);
      }
      
      // 树叶
      const leafRadius = 2;
      for (let x = -leafRadius; x <= leafRadius; x++) {
        for (let y = trunkHeight - 1; y <= trunkHeight + 1; y++) {
          for (let z = -leafRadius; z <= leafRadius; z++) {
            const distance = Math.sqrt(x * x + y * y + z * z);
            if (distance <= leafRadius + 0.5) {
              const block = createBlock(treeX + x, maxY + y, treeZ + z, 5); // 树叶
              const key = positionToKey({ x: treeX + x, y: maxY + y, z: treeZ + z });
              if (!blocks.value.has(key)) {
                blocks.value.set(key, block);
              }
            }
          }
        }
      }
    }
  }
};

// 处理方块点击
const handleBlockClick = (position: { x: number; y: number; z: number }, interaction: 'place' | 'break') => {
  const key = positionToKey(position);
  
  if (interaction === 'break') {
    // 破坏方块
    const block = blocks.value.get(key);
    if (block) {
      blocks.value.delete(key);
      // 通知渲染器更新
      if (stateUpdateCallback) {
        stateUpdateCallback({ blocks: blocks.value });
      }
    }
  } else if (interaction === 'place') {
    // 放置方块（检查是否有足够空间）
    if (!blocks.value.has(key)) {
      const block = createBlock(position.x, position.y, position.z, selectedBlockType.value);
      blocks.value.set(key, block);
      // 通知渲染器更新
      if (stateUpdateCallback) {
        stateUpdateCallback({ blocks: blocks.value });
      }
    }
  }
};

// 处理场景就绪
const handleSceneReady = () => {
  sceneReady.value = true;
};

// 处理监听器注册
let stateUpdateCallback: ((data: any) => void) | null = null;

const handleRegisterListener = (callback: (data: any) => void) => {
  stateUpdateCallback = callback;
  // 立即发送当前状态
  if (stateUpdateCallback) {
    stateUpdateCallback({
      blocks: blocks.value,
      playerPosition: player.position
    });
  }
};

// 更新玩家物理
const updatePhysics = () => {
  // 应用重力
  player.velocity.y -= config.gravity;
  
  // 检查是否在地面上
  const footPos = {
    x: Math.round(player.position.x),
    y: Math.round(player.position.y - 1),
    z: Math.round(player.position.z)
  };
  const footKey = positionToKey(footPos);
  
  player.canJump = blocks.value.has(footKey);
  
  // 简化的碰撞检测
  if (player.velocity.y < 0 && player.canJump) {
    player.velocity.y = 0;
    player.position.y = Math.floor(player.position.y);
  }
  
  // 更新玩家位置
  player.position.add(player.velocity);
  
  // 限制速度
  player.velocity.x = clamp(player.velocity.x, -config.speed, config.speed);
  player.velocity.z = clamp(player.velocity.z, -config.speed, config.speed);
  player.velocity.y = clamp(player.velocity.y, -5, 5);
};

// 键盘事件处理
const setupKeyboardControls = () => {
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key.toLowerCase()) {
      case 'w':
        keys.forward = true;
        break;
      case 's':
        keys.backward = true;
        break;
      case 'a':
        keys.left = true;
        break;
      case 'd':
        keys.right = true;
        break;
      case ' ':
        if (player.canJump) {
          player.velocity.y = config.jumpHeight;
          player.canJump = false;
        }
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
        const typeIndex = parseInt(event.key) - 1;
        if (typeIndex >= 0 && typeIndex < blockTypes.length) {
          selectedBlockType.value = typeIndex;
        }
        break;
    }
  };
  
  const handleKeyUp = (event: KeyboardEvent) => {
    switch (event.key.toLowerCase()) {
      case 'w':
        keys.forward = false;
        break;
      case 's':
        keys.backward = false;
        break;
      case 'a':
        keys.left = false;
        break;
      case 'd':
        keys.right = false;
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  });
};

// 游戏循环
let gameLoopId: number | null = null;
let updateCounter = 0;
const gameLoop = () => {
  // 更新玩家移动
  const moveSpeed = config.speed * 0.1;
  
  if (keys.forward) {
    player.velocity.z -= moveSpeed;
  }
  if (keys.backward) {
    player.velocity.z += moveSpeed;
  }
  if (keys.left) {
    player.velocity.x -= moveSpeed;
  }
  if (keys.right) {
    player.velocity.x += moveSpeed;
  }
  
  // 减速
  player.velocity.x *= 0.9;
  player.velocity.z *= 0.9;
  
  // 更新物理
  updatePhysics();
  
  // 每16帧更新一次渲染器状态
  updateCounter++;
  if (updateCounter % 16 === 0 && stateUpdateCallback) {
    stateUpdateCallback({
      playerPosition: player.position
    });
    updateCounter = 0;
  }
  
  gameLoopId = requestAnimationFrame(gameLoop);
};

// 生命周期
onMounted(() => {
  generateWorld();
  setupKeyboardControls();
  gameLoop();
});

onUnmounted(() => {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
  }
});
</script>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-text {
  color: white;
  font-size: 24px;
  font-family: Arial, sans-serif;
}

.controls-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 5px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  max-width: 200px;
}

.controls-panel h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.controls-panel p {
  margin: 5px 0;
}
</style>