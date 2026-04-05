import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. Import Pinia
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia() // 2. Buat instance Pinia

app.use(pinia) // 3. Pasang Pinia ke App (WAJIB SEBELUM ROUTER)
app.use(router)

app.mount('#app')