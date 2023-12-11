/*
 * @Author: alex
 * @Date: 2022-02-16 10:55:13
 * @LastEditTime: 2023-12-07 13:48:53
 * @LastEditors: zhouyinkui
 * @Description: main.ts
 * @FilePath: \LSH-DV-FRONTEND\src\main.ts
 */
import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { remTool } from '@mo-yu/core'
import './assets/app.scss'
import { initCesium } from './map/mapViewAble'
import router from './router'

remTool.resetDesignSize(1920, 1080)
remTool.enable()
initCesium(import.meta.env.CESIUM_BASE_URL, import.meta.env.CESIUM_ACCESS_TOKEN)

const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

const app = createApp(App)
app.use(createPinia()).use(router).mount('#app')
