<template>
  <div class="app">
    <MinecraftGame />
  </div>
</template>

<script setup lang="ts">
import MinecraftGame from './components/MinecraftGame.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}

.app {
  width: 100%;
  height: 100%;
}
</style>
