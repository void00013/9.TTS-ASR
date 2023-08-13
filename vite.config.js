import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 字符串简写写法：http://localhost:5173/oauth -> https://aip.baidubce.com/oauth
      '/oauth': 'https://aip.baidubce.com',
      '/text2audio': 'https://tsn.baidu.com'
    }
  }
})
