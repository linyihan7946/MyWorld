<template>
  <Teleport to="body">
    <div v-if="isOpen" class="structure-block-ui" @click.self="close">
      <div class="structure-modal">
        <div class="modal-header">
          <span class="modal-icon">{{ icon }}</span>
          <span class="modal-title">{{ title }}</span>
          <button class="close-btn" @click="close">×</button>
        </div>

        <div class="modal-body">
          <label class="field-label">结构名称:</label>
          <input
            v-model="structureName"
            class="name-input"
            type="text"
            placeholder="输入结构名称 (例如: house)"
            maxlength="64"
          />

          <div class="info-row">
            <span class="info-label">位置:</span>
            <span class="info-value">X: {{ position.x }} Y: {{ position.y }} Z: {{ position.z }}</span>
          </div>

          <div class="mode-row">
            <span class="info-label">模式:</span>
            <label class="toggle-label">
              <input type="checkbox" v-model="isSaveMode" />
              <span>保存模式</span>
            </label>
            <span class="mode-hint">(保存: 记录名称供读取; 读取: 载入已保存结构)</span>
          </div>

          <div class="examples">
            <div class="examples-title">💡 用法:</div>
            <div class="example-line">1. 保存模式下输入名称 → 点击「保存结构」</div>
            <div class="example-line">2. 读取模式下输入名称 → 点击「读取结构」</div>
            <div class="example-line">3. 已保存的结构名称会被记录在此方块中</div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-cancel" @click="close">取消</button>
          <button class="btn btn-save" @click="saveStructure">{{ isSaveMode ? '💾 保存结构' : '📂 读取结构' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { BlockType } from '@/types/blocks'
import { setBlockState, getBlockStateValue } from '@/gameplay/BlockStateSystem'

const isOpen = ref(false)
const structureName = ref('')
const isSaveMode = ref(true)
const position = ref({ x: 0, y: 0, z: 0 })
const blockType = ref<BlockType>(BlockType.STRUCTURE_BLOCK)

const icon = computed(() => (blockType.value === BlockType.JIGSAW_BLOCK ? '🧩' : '📦'))
const title = computed(() => (blockType.value === BlockType.JIGSAW_BLOCK ? '拼图方块' : '结构方块'))

function open(data: { x: number; y: number; z: number; blockType: BlockType }) {
  position.value = { x: data.x, y: data.y, z: data.z }
  blockType.value = data.blockType
  structureName.value = getBlockStateValue(data.x, data.y, data.z, 'structureName', '') as string
  isSaveMode.value = true
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function saveStructure() {
  const { x, y, z } = position.value
  // 保存/读取均将名称记录到方块状态中（结构数据实际存储由方块状态系统承担）
  setBlockState(x, y, z, { structureName: structureName.value.trim() })
  close()
}

defineExpose({ open, close })
</script>

<style scoped>
.structure-block-ui {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.structure-modal {
  background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
  border: 4px solid #4FC3F7;
  border-radius: 10px;
  min-width: 450px;
  max-width: 560px;
  box-shadow: 0 0 50px rgba(79, 195, 247, 0.4);
  font-family: 'Courier New', monospace;
  color: #fff;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid #333;
  background: rgba(79, 195, 247, 0.1);
}

.modal-icon { font-size: 24px; margin-right: 10px; }

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #4FC3F7;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0 5px;
}

.close-btn:hover { color: #f44336; }

.modal-body { padding: 20px; }

.field-label {
  display: block;
  font-size: 13px;
  color: #aaa;
  margin-bottom: 8px;
}

.name-input {
  width: 100%;
  padding: 10px 12px;
  background: #000;
  border: 3px solid #444;
  color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin-bottom: 15px;
}

.name-input:focus { outline: none; border-color: #4FC3F7; }

.info-row, .mode-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 13px;
}

.info-label { color: #aaa; }
.info-value { color: #4FC3F7; }

.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
}

.toggle-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #4FC3F7;
}

.mode-hint { color: #888; font-size: 12px; }

.examples {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #444;
  border-radius: 5px;
  padding: 12px;
  margin-top: 10px;
}

.examples-title {
  color: #FFEB3B;
  font-size: 12px;
  margin-bottom: 8px;
}

.example-line {
  padding: 3px 0;
  color: #4CAF50;
  font-size: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 2px solid #333;
}

.btn {
  padding: 10px 20px;
  border: 3px solid #555;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 5px;
}

.btn-cancel { background: #333; color: #fff; }
.btn-cancel:hover { background: #444; }

.btn-save {
  background: #4FC3F7;
  color: #000;
  border-color: #81D4FA;
}

.btn-save:hover { background: #81D4FA; }
</style>
