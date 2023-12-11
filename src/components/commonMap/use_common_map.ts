/*
 * @Author: zhouyinkui
 * @Date: 2022-07-20 09:28:38
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2022-07-20 09:30:28
 * @Description:
 * Copyright (c) 2022 by piesat, All Rights Reserved.
 */
import { inject, Ref } from 'vue'
import { createInjectionKey } from 'naive-ui/lib/_utils'

export const mapApiInjectionKey =
  createInjectionKey<Ref<string>>('common-map-id')

export default function useCommonMap() {
  const mapId = inject(mapApiInjectionKey, null)
  if (mapId === null) {
    throw new Error('注入map id失败！')
  }
  return mapId
}
