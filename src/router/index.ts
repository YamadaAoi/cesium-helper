/*
 * @Author: panrong
 * @Date: 2022-02-16 15:29:34
 * @LastEditTime: 2023-12-08 14:54:56
 * @LastEditors: zhouyinkui
 * @Description: 路由
 */
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tileConfig' },
  {
    path: '/tileConfig',
    name: 'TileConfig',
    component: () => import('../views/tileConfig/TileConfig.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
