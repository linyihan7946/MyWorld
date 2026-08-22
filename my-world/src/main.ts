import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')

// 开发调试：暴露 pinia 实例供自动化测试使用
if (import.meta.env.DEV) {
  ;(window as any).__pinia = pinia
}
