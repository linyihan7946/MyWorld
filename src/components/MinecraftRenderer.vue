<template>
  <div ref="containerRef" class="renderer-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Block, BlockType, GameConfig } from '../types/game';

// Props - 简化props，避免传递复杂对象
interface Props {
  // 不直接传递复杂对象，而是通过事件通信
}

const props = withDefaults(defineProps<Props>(), {});

// 本地状态
let blocksMap: Map<string, Block> = new Map();
let blockTypesList: BlockType[] = [];
let gameConfig: GameConfig = {
  gravity: 0.08,
  speed: 0.2,
  jumpHeight: 0.3,
  blockSize: 1
};
let currentPlayerPosition: THREE.Vector3 = new THREE.Vector3(0, 10, 0);

// Emits
interface Emits {
  (e: 'block-click', position: { x: number; y: number; z: number }, interaction: 'place' | 'break'): void;
  (e: 'scene-ready'): void;
  // 新增事件用于更新状态
  (e: 'register-listener', callback: (data: any) => void): void;
}

const emit = defineEmits<Emits>();

// 注册状态更新监听器
onMounted(() => {
  nextTick(() => {
    emit('register-listener', (data: any) => {
      if (data.blocks) {
        blocksMap = data.blocks;
        updateBlocks();
      }
      if (data.playerPosition) {
        currentPlayerPosition.copy(data.playerPosition);
      }
    });
  });
});

// Refs
const containerRef = ref<HTMLElement | null>(null);

// Three.js objects - 使用非响应式变量
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let raycaster: THREE.Raycaster | null = null;
let mouse: THREE.Vector2 | null = null;
let animateId: number | null = null;
let skybox: THREE.Mesh | null = null;

// 初始化场景
const initScene = () => {
  if (!containerRef.value) return;

  // 创建场景
  scene = new THREE.Scene();

  // 创建相机
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(currentPlayerPosition.x, currentPlayerPosition.y + 5, currentPlayerPosition.z + 15);
  camera.lookAt(currentPlayerPosition);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = false; // 禁用阴影
  containerRef.value.appendChild(renderer.domElement);

  // 创建控制器
  if (camera && renderer) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
  }

  // 创建射线投射器
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  // 禁用阴影以避免Vue响应式代理问题
    directionalLight.position.set(10, 20, 5);
    // directionalLight.castShadow = true;
    // directionalLight.shadow.camera.top = 50;
    // directionalLight.shadow.camera.bottom = -50;
    // directionalLight.shadow.camera.left = -50;
    // directionalLight.shadow.camera.right = 50;
  scene.add(directionalLight);

  // 添加天空盒
  const geometry = new THREE.BoxGeometry(1000, 1000, 1000);
  const material = new THREE.MeshBasicMaterial({
    color: 0x87CEEB,
    side: THREE.BackSide
  });
  skybox = new THREE.Mesh(geometry, material);
  scene.add(skybox);

  // 添加事件监听
  setupEventListeners();

  // 开始动画循环
  animate();

  // 通知场景准备就绪
  emit('scene-ready');
};

// 设置事件监听
const setupEventListeners = () => {
  if (!containerRef.value || !raycaster || !camera || !mouse) return;

  const handleMouseMove = (event: MouseEvent) => {
    const rect = containerRef.value!.getBoundingClientRect();
    mouse!.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse!.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  const handleClick = (event: MouseEvent) => {
    if (!raycaster || !camera || !scene || !mouse) return;

    // 计算鼠标在归一化设备坐标中的位置
    const rect = containerRef.value!.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // 更新射线投射器
    raycaster.setFromCamera(mouse, camera);

    // 获取所有方块网格
    const blockMeshes = Array.from(blocksMap.values()).map(block => block.mesh);
    const intersects = raycaster.intersectObjects(blockMeshes);

    if (intersects.length > 0 && intersects[0]) {
      const hit = intersects[0];
      const blockPos = hit.object.position;
      const position = {
        x: Math.round(blockPos.x),
        y: Math.round(blockPos.y),
        z: Math.round(blockPos.z)
      };

      // 根据点击按钮确定交互类型
      if (event.button === 0) {
        // 左键破坏方块
        emit('block-click', position, 'break');
      } else if (event.button === 2) {
        // 右键放置方块（在点击面的外侧）
        if (hit.face) {
          const normal = hit.face.normal;
          const placePosition = {
            x: Math.round(blockPos.x + normal.x),
            y: Math.round(blockPos.y + normal.y),
            z: Math.round(blockPos.z + normal.z)
          };
          emit('block-click', placePosition, 'place');
        }
      }
    }
  };

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
  };

  const handleResize = () => {
    if (!camera || !renderer || !containerRef.value) return;

    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
  };

  window.addEventListener('resize', handleResize);
  containerRef.value.addEventListener('mousemove', handleMouseMove);
  containerRef.value.addEventListener('click', handleClick);
  containerRef.value.addEventListener('contextmenu', handleContextMenu);

  // 清理函数
  const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    if (containerRef.value) {
      containerRef.value.removeEventListener('mousemove', handleMouseMove);
      containerRef.value.removeEventListener('click', handleClick);
      containerRef.value.removeEventListener('contextmenu', handleContextMenu);
    }
  };

  onUnmounted(cleanup);
};

// 更新方块
const updateBlocks = () => {
  if (!scene) return;

  // 清除现有方块
  Array.from(blocksMap.values()).forEach(block => {
    if (block.mesh.parent === scene) {
      scene!.remove(block.mesh);
    }
  });

  // 添加所有方块
  blocksMap.forEach((block) => {
    if (block.mesh.parent !== scene) {
      scene!.add(block.mesh);
    }
  });
};

// 动画循环
const animate = () => {
  animateId = requestAnimationFrame(animate);

  if (controls) {
    controls.update();
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

// 不再需要监听props变化，现在使用事件驱动更新

// 生命周期
onMounted(() => {
  nextTick(() => {
    initScene();
  });
});

onUnmounted(() => {
  if (animateId) {
    cancelAnimationFrame(animateId);
  }

  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement);
    renderer.dispose();
  }
});
</script>

<style scoped>
.renderer-container {
  width: 100%;
  height: 100%;
  cursor: crosshair;
}
</style>