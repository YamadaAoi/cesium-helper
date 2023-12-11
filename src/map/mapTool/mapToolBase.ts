/*
 * @Author: zhouyinkui
 * @Date: 2023-12-07 13:39:43
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-07 13:41:53
 * @Description:
 */
import { ToolBase, ToolBaseOptions } from '@mo-yu/core'
import { mapShare } from '../store/map_share'

export interface MapToolBaseOptions extends ToolBaseOptions {
  /**
   * 地图id
   */
  mapId?: string
}

/**
 * 鼠标样式
 */
export type CursorProperty =
  | '-moz-grab'
  | '-webkit-grab'
  | 'alias'
  | 'all-scroll'
  | 'auto'
  | 'cell'
  | 'col-resize'
  | 'context-menu'
  | 'copy'
  | 'crosshair'
  | 'default'
  | 'e-resize'
  | 'ew-resize'
  | 'grab'
  | 'grabbing'
  | 'help'
  | 'move'
  | 'n-resize'
  | 'ne-resize'
  | 'nesw-resize'
  | 'no-drop'
  | 'none'
  | 'not-allowed'
  | 'ns-resize'
  | 'nw-resize'
  | 'nwse-resize'
  | 'pointer'
  | 'progress'
  | 'row-resize'
  | 's-resize'
  | 'se-resize'
  | 'sw-resize'
  | 'text'
  | 'vertical-text'
  | 'w-resize'
  | 'wait'
  | 'zoom-in'
  | 'zoom-out'

/**
 * 地图工具抽象类
 * @typeParam O - 类构造入参
 * @typeParam T - 类事件类型
 */
export abstract class MapToolBase<
  O extends MapToolBaseOptions,
  T
> extends ToolBase<O, T> {
  constructor(options: O) {
    super(options)
  }

  protected get mapView() {
    return mapShare.getMap(this.options.mapId)
  }

  /**
   * 更改鼠标样式
   * @param type -
   */
  protected setCursor(type: CursorProperty) {
    if (this.mapView?.mapIns.canvas) {
      this.mapView.mapIns.canvas.style.cursor = type
    }
  }
}
