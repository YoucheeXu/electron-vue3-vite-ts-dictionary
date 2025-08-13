import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./", // 打包相对路径,否则electron加载index.html时找不到css,js文件
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    strictPort: true, // 固定端口(如果端口被占用则中止)
    host: true, // 0.0.0.0
    port: 3920, // 指定启动端口
  },
});
