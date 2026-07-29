<template>
  <Teleport to="body">
    <div v-if="isOpen" class="command-block-ui" @click.self="close">
      <div class="command-modal">
        <div class="modal-header">
          <span class="modal-icon">{{ icon }}</span>
          <span class="modal-title">{{ title }}</span>
          <button class="close-btn" @click="close">×</button>
        </div>

        <div class="modal-body">
          <label class="field-label">命令输入:</label>
          <textarea
            v-model="command"
            class="command-input"
            rows="4"
            placeholder="输入Minecraft命令... (例如: /say Hello)"
            @keydown.enter.ctrl="save"
          />

          <div v-if="commandError" class="command-error">
            <div class="error-header">❌ 命令错误</div>
            <div class="error-msg">{{ commandError }}</div>
          </div>

          <div class="settings-row">
            <label class="toggle-label">
              <input type="checkbox" v-model="alwaysOn" />
              <span>保持开启</span>
            </label>
            <label class="toggle-label">
              <input type="checkbox" v-model="conditional" />
              <span>条件</span>
            </label>
          </div>

          <div class="examples">
            <div class="examples-title">💡 命令示例:</div>
            <code @click="command = '/say Hello World!'">/say Hello World!</code>
            <code @click="command = '/give @p diamond 64'">/give @p diamond 64</code>
            <code @click="command = '/tp @p 100 64 200'">/tp @p 100 64 200</code>
            <code @click="command = '/time set day'">/time set day</code>
            <code @click="command = '/weather clear'">/weather clear</code>
            <code @click="command = '/gamemode creative @a'">/gamemode creative @a</code>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-cancel" @click="close">取消</button>
          <button class="btn btn-save" @click="save">保存命令</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { BlockType } from '@/types/blocks'
import { setCommand, setBlockState, getCommand, getBlockStateValue } from '@/gameplay/BlockStateSystem'

const isOpen = ref(false)
const command = ref('')
const alwaysOn = ref(false)
const conditional = ref(false)
const commandError = ref('')
const position = ref({ x: 0, y: 0, z: 0 })
const blockType = ref<BlockType>(BlockType.COMMAND_BLOCK)

const icon = computed(() => {
  switch (blockType.value) {
    case BlockType.COMMAND_BLOCK: return '⚡'
    case BlockType.CHAIN_COMMAND_BLOCK: return '⛓️'
    case BlockType.REPEAT_COMMAND_BLOCK: return '🔄'
    default: return '⚡'
  }
})

const title = computed(() => {
  switch (blockType.value) {
    case BlockType.COMMAND_BLOCK: return '命令方块'
    case BlockType.CHAIN_COMMAND_BLOCK: return '连锁命令方块'
    case BlockType.REPEAT_COMMAND_BLOCK: return '循环命令方块'
    default: return '命令方块'
  }
})

// 简单命令验证
function validateCommand(cmd: string): string {
  if (!cmd.trim()) return ''

  if (!cmd.startsWith('/')) {
    return '❌ 命令完全错误！请重新输入！命令必须以 / 开头'
  }

  const parts = cmd.substring(1).split(/\s+/)
  const cmdName = parts[0].toLowerCase()

  const knownCommands = [
    'say', 'give', 'tp', 'teleport', 'time', 'weather', 'gamemode',
    'kill', 'effect', 'setblock', 'fill', 'summon', 'clear',
    'difficulty', 'gamerule', 'title', 'enchant', 'playsound',
    'clone', 'execute', 'worldborder', 'xp', 'experience',
    'spawnpoint', 'schedule'
  ]

  if (!knownCommands.includes(cmdName)) {
    return `❌ 未知命令: "${cmdName}"。您是否想输入: /${knownCommands.filter(c => c.startsWith(cmdName.substring(0, 2))).slice(0, 3).join(', /')}？`
  }

  return ''
}

function open(data: { x: number; y: number; z: number; blockType: BlockType }) {
  position.value = { x: data.x, y: data.y, z: data.z }
  blockType.value = data.blockType
  command.value = getCommand(data.x, data.y, data.z)
  alwaysOn.value = getBlockStateValue(data.x, data.y, data.z, 'alwaysOn', false) as boolean
  conditional.value = getBlockStateValue(data.x, data.y, data.z, 'conditional', false) as boolean
  commandError.value = ''
  isOpen.value = true
}

function close() {
  isOpen.value = false
  commandError.value = ''
}

function save() {
  const error = validateCommand(command.value)
  if (error) {
    commandError.value = error
    return
  }

  const { x, y, z } = position.value
  setCommand(x, y, z, command.value)
  setBlockState(x, y, z, {
    alwaysOn: alwaysOn.value,
    conditional: conditional.value,
  })

  close()
}

defineExpose({ open, close })
</script>

<style scoped>
.command-block-ui {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.command-modal {
  background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
  border: 4px solid #FF9800;
  border-radius: 10px;
  min-width: 550px;
  max-width: 650px;
  box-shadow: 0 0 50px rgba(255, 152, 0, 0.5);
  font-family: 'Courier New', monospace;
  color: #fff;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid #333;
  background: rgba(255, 152, 0, 0.1);
}

.modal-icon {
  font-size: 24px;
  margin-right: 10px;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #FF9800;
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

.close-btn:hover {
  color: #f44336;
}

.modal-body {
  padding: 20px;
}

.field-label {
  display: block;
  font-size: 13px;
  color: #aaa;
  margin-bottom: 8px;
}

.command-input {
  width: 100%;
  padding: 12px;
  background: #000;
  border: 3px solid #444;
  color: #fff;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 10px;
}

.command-input:focus {
  outline: none;
  border-color: #FF9800;
}

.command-error {
  background: rgba(244, 67, 54, 0.2);
  border: 2px solid #f44336;
  border-radius: 5px;
  padding: 12px;
  margin-bottom: 15px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.error-header {
  font-weight: bold;
  color: #f44336;
  margin-bottom: 5px;
}

.error-msg {
  color: #ff8a80;
  font-size: 13px;
}

.settings-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
}

.toggle-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #FF9800;
}

.examples {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #444;
  border-radius: 5px;
  padding: 12px;
}

.examples-title {
  color: #FFEB3B;
  font-size: 12px;
  margin-bottom: 8px;
}

.examples code {
  display: block;
  padding: 5px 8px;
  margin: 3px 0;
  background: rgba(0, 0, 0, 0.5);
  color: #4CAF50;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s;
}

.examples code:hover {
  background: rgba(76, 175, 80, 0.2);
  color: #81C784;
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

.btn-cancel {
  background: #333;
  color: #fff;
}

.btn-cancel:hover {
  background: #444;
}

.btn-save {
  background: #FF9800;
  color: #000;
  border-color: #FFB74D;
}

.btn-save:hover {
  background: #FFB74D;
}
</style>
