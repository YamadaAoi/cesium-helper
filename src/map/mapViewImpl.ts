/*
 * @Author: zhouyinkui
 * @Date: 2022-06-29 10:46:24
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-07 15:47:20
 * @Description:
 * Copyright (c) 2022 by piesat, All Rights Reserved.
 */
import * as Cesium from 'cesium'
import { guid, getDefault, ToolBase } from '@mo-yu/core'
import { CameraParam, getDefaultOptions, MapOption } from './mapViewAble'
import { mapShare } from './store/map_share'

/**
 * 地图视图事件类型
 */
export interface MapViewBaseEventType {
  /**
   * 加载完地图后触发
   */
  ready: { view: MapView }
}

export class MapView extends ToolBase<MapOption, MapViewBaseEventType> {
  /**
   * view 所渲染的 div节点 /节点id
   */
  #container: HTMLElement | string
  /**
   * 地图视图组件参数
   */
  #options!: MapOption
  /**
   * 地图实例
   */
  #map!: Cesium.Viewer

  constructor(container: HTMLElement | string, options: MapOption) {
    super(options)
    this.#container = container
    this.initMap(options)
  }

  enable(): void {
    //
  }

  destroy(): void {
    //
  }

  protected initMap(options?: MapOption): void {
    this.#options = {
      id: options?.id ?? guid(),
      baseOption: getDefault(getDefaultOptions(), options?.baseOption)
    }
    // 初始化 maplibre
    this.#map = new Cesium.Viewer(this.#container, {
      ...this.#options.baseOption
    })
    mapShare.setMap(this.id, this)
    this.insertPopupDom()
    this.setMouseRight()
    this.hidecredit()
    const handler = new Cesium.ScreenSpaceEventHandler(this.#map.canvas)
    handler.setInputAction(
      (event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const cartesian = this.#map.scene.pickPosition(event.position)
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
        const lng = Cesium.Math.toDegrees(cartographic.longitude) // 经度
        const lat = Cesium.Math.toDegrees(cartographic.latitude) // 纬度
        const alt = cartographic.height // 高度
        const coordinate = {
          longitude: lng,
          latitude: lat,
          altitude: alt
        }
        console.log([
          coordinate.longitude,
          coordinate.latitude,
          coordinate.altitude
        ])
        mapShare.setCurMapId(this.id)
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    )
    const helper = new Cesium.EventHelper()
    helper.add(this.#map?.scene.globe.tileLoadProgressEvent, number => {
      if (number < 1) {
        this.eventBus.fire('ready', { view: this })
      }
    })
  }

  remove() {
    try {
      mapShare.deleteMap(this.id)
      this.#map.destroy()
    } catch (error) {
      console.warn(`清除异常！${error}`)
    }
  }

  /**
   * 加载geojson
   * @param data
   * @param options
   * @returns
   */
  async addGeoJSON(data: any, options?: Cesium.GeoJsonDataSource.LoadOptions) {
    const geo = await Cesium.GeoJsonDataSource.load(data, options)
    const dataSource = await this.#map.dataSources.add(geo)
    return dataSource
  }

  /**
   * 添加地形
   * @param url
   */
  addTerrain(url: string) {
    this.#map.terrainProvider = new Cesium.CesiumTerrainProvider({
      url,
      requestVertexNormals: true,
      requestWaterMask: true
    })
    this.#map.scene.globe.depthTestAgainstTerrain = true
  }

  fitBounds(bounds: [number, number, number, number], height = 0) {
    const boundingSphere = Cesium.BoundingSphere.fromPoints([
      Cesium.Cartesian3.fromDegrees(bounds[0], bounds[1], height),
      Cesium.Cartesian3.fromDegrees(bounds[2], bounds[3], height)
    ])
    this.#map.camera.flyToBoundingSphere(boundingSphere)
  }

  getScene() {
    let scene: CameraParam | undefined
    if (this.#map) {
      const camera = this.#map.camera
      scene = {
        heading: Cesium.Math.toDegrees(camera.heading),
        pitch: Cesium.Math.toDegrees(camera.pitch),
        roll: Cesium.Math.toDegrees(camera.roll),
        lng: Cesium.Math.toDegrees(camera.positionCartographic.longitude),
        lat: Cesium.Math.toDegrees(camera.positionCartographic.latitude),
        height: camera.positionCartographic.height
      }
    }
    return scene
  }

  /**
   * 添加自定义弹窗图层
   */
  private insertPopupDom() {
    if (this.#map) {
      const container = this.#map.container
      if (container) {
        const cesiumContainer =
          container.getElementsByClassName('cesium-viewer')?.[0]
        if (cesiumContainer) {
          const popupContainer = document.createElement('div')
          popupContainer.className = 'cesium-viewer-popup-container'
          popupContainer.style.position = 'absolute'
          popupContainer.style.top = '0'
          popupContainer.style.left = '0'
          popupContainer.id = `cesium-viewer-popup-container-${this.id}`
          cesiumContainer.appendChild(popupContainer)
        }
      }
    }
  }

  /**
   * 自定义鼠标右键操作
   */
  private setMouseRight() {
    if (this.#map?.scene?.screenSpaceCameraController) {
      this.#map.scene.screenSpaceCameraController.tiltEventTypes = [
        Cesium.CameraEventType.RIGHT_DRAG,
        Cesium.CameraEventType.PINCH,
        {
          eventType: Cesium.CameraEventType.LEFT_DRAG,
          modifier: Cesium.KeyboardEventModifier.CTRL
        },
        {
          eventType: Cesium.CameraEventType.RIGHT_DRAG,
          modifier: Cesium.KeyboardEventModifier.CTRL
        }
      ]
      this.#map.scene.screenSpaceCameraController.zoomEventTypes = [
        Cesium.CameraEventType.MIDDLE_DRAG,
        Cesium.CameraEventType.WHEEL,
        Cesium.CameraEventType.PINCH
      ]
    }
  }

  /**
   * 隐藏creditContainer
   */
  private hidecredit() {
    this.#map?.cesiumWidget.creditContainer.setAttribute(
      'style',
      'display: none'
    )
  }
  /**
   * 返回map实例
   */
  get mapIns(): Cesium.Viewer {
    return this.#map
  }

  /**
   * 返回mapID
   */
  get id(): string {
    return this.#options?.id
  }
}
