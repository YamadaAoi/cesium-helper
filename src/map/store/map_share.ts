/*
 * @Author: zhouyinkui
 * @Date: 2022-07-20 16:07:54
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-07 13:48:27
 * @Description:
 * Copyright (c) 2022 by piesat, All Rights Reserved.
 */
import { ToolBase, ToolBaseOptions } from '@mo-yu/core'
import { MapView } from '../mapViewImpl'

interface MapShareInfo {
  mapIns?: MapView
}

type MapShareStore = Record<string, MapShareInfo>

interface MapShareEvents {
  /**
   * 当前选中地图实例发生变化
   */
  'current-map-layer-change': {
    mapId: string
  }
}

class MapShare extends ToolBase<ToolBaseOptions, MapShareEvents> {
  #curMapId = ''
  #share: MapShareStore = {}

  enable(): void {
    //
  }

  destroy(): void {
    //
  }

  /**
   * @description: 创建地图实例时，应当保存一份地图实例
   * @param {string} mapId
   * @param {MapView} map
   * @return {*}
   */
  setMap(mapId: string, map: MapView) {
    if (!this.#share[mapId]) {
      this.#share[mapId] = {}
    }
    this.#share[mapId].mapIns = map
  }

  deleteMap(mapId: string) {
    if (this.#share[mapId]) {
      delete this.#share[mapId]
    }
  }

  getMap(mapId?: string) {
    if (mapId) {
      return this.#share[mapId]?.mapIns
    } else {
      return this.#share[this.#curMapId]?.mapIns
    }
  }

  setCurMapId(mapId: string) {
    if (mapId && mapId !== this.#curMapId) {
      this.#curMapId = mapId
      this.emitCurrentMapLayerChange(mapId)
    }
  }

  private emitCurrentMapLayerChange(mapId: string) {
    if (mapId === this.#curMapId) {
      this.eventBus.fire('current-map-layer-change', {
        mapId
      })
    }
  }

  get curMapId() {
    return this.#curMapId
  }

  get curMap() {
    return this.getMap(this.curMapId)
  }
}

export const mapShare = new MapShare({})
