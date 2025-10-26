import * as THREE from 'three';
import type { Position } from '../types/game';

/**
 * 将方块坐标转换为字符串键
 */
export function positionToKey(position: Position): string {
  return `${position.x},${position.y},${position.z}`;
}

/**
 * 将字符串键转换为方块坐标
 */
export function keyToPosition(key: string): Position {
  const [x, y, z] = key.split(',').map(Number);
  return {
    x: x || 0,
    y: y || 0,
    z: z || 0
  };
}

/**
 * 计算两点之间的距离
 */
export function distance(pos1: Position, pos2: Position): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 四舍五入坐标到最近的整数方块位置
 */
export function roundToBlock(position: THREE.Vector3): Position {
  return {
    x: Math.round(position.x),
    y: Math.round(position.y),
    z: Math.round(position.z)
  };
}

/**
 * 检查两个位置是否相同
 */
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y && pos1.z === pos2.z;
}

/**
 * 生成随机数
 */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 生成随机整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 限制数值在指定范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}