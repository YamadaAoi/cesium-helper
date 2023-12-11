/*
 * @Author: zhouyinkui
 * @Date: 2022-05-05 09:41:26
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-01 11:22:28
 * @Description:
 * Copyright (c) 2022 by piesat, All Rights Reserved.
 */
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    label?: string
  }
}
