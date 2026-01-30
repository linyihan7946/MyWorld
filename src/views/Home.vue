<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { Game } from '../game/Game';
import UIOverlay from '../components/UIOverlay.vue';

const container = ref<HTMLElement | null>(null);
let game: Game | null = null;

onMounted(() => {
  if (container.value) {
    game = new Game(container.value);
  }
});

onUnmounted(() => {
  if (game) {
    game.dispose();
  }
});
</script>

<template>
  <div class="game-container" ref="container">
    <UIOverlay />
  </div>
</template>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}
</style>
