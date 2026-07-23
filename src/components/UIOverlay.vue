<template>
  <div class="ui-overlay">
    <div class="crosshair">+</div>
    <div class="controls">
      <p>WASD to Move, Space to Jump</p>
      <p>Click to Lock Mouse</p>
      <p>Left Click to Mine (Hold 11 ticks)</p>
      <p>Right Click to Place</p>
    </div>
  </div>
</template>

<style scoped>
.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.crosshair {
  font-size: 32px;
  color: white;
  font-weight: bold;
  text-shadow: 1px 1px 1px black;
}

.controls {
  position: absolute;
  top: 10px;
  left: 10px;
  color: white;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 4px;
}
</style>
