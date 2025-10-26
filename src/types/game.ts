import * as THREE from 'three';

// 方块类型定义
export interface BlockType {
  name: string;
  color: number;
  transparent?: boolean;
  opacity?: number;
}

// 方块信息定义
export interface Block {
  mesh: THREE.Mesh;
  type: number;
}

// 玩家状态定义
export interface PlayerState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  canJump: boolean;
}

// 游戏配置定义
export interface GameConfig {
  gravity: number;
  speed: number;
  jumpHeight: number;
  blockSize: number;
}

// 方向向量定义
export type Direction = 'forward' | 'backward' | 'left' | 'right';

// 位置坐标定义
export interface Position {
  x: number;
  y: number;
  z: number;
}

// 方块交互类型
export type InteractionType = 'place' | 'break';