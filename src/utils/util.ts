/*
 * @Author: zhouyinkui
 * @Date: 2022-03-01 10:51:17
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-12 15:18:45
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

export function readText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      if (typeof e.target?.result === 'string') {
        resolve(e.target.result)
      } else {
        reject(new Error('parse Blob fail!'))
      }
    }
    reader.onerror = error => {
      reject(error)
    }
    reader.readAsText(blob)
  })
}

export function saveAsJson(data: any, fileName = 'data.json') {
  const content = JSON.stringify(data)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const objectURL = URL.createObjectURL(blob)
  download(objectURL, fileName)
  URL.revokeObjectURL(objectURL)
}
