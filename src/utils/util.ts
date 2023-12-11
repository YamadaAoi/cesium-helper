/*
 * @Author: zhouyinkui
 * @Date: 2022-03-01 10:51:17
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-01 10:49:33
 * @Description: 一些通用方法
 * Copyright (c) 2022 by piesat, All Rights Reserved.
 */
export function download(url: string, fileName: string) {
  const aLink = document.createElement('a')
  const evt = document.createEvent('HTMLEvents')
  evt.initEvent('click', true, true)
  aLink.download = fileName
  aLink.target = '_blank'
  aLink.href = url
  aLink.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
  )
}
