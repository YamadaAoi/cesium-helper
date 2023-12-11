/*
 * @Author: zhouyinkui
 * @Date: 2022-06-29 11:15:56
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-01 13:19:44
 * @Description:
 * Copyright (c) 2022 by piesat, All Rights Reserved.
 */
import {
  Cartesian3,
  Cesium3DTileset,
  Ellipsoid,
  Ion,
  Math as CMath,
  SceneMode,
  Viewer
} from 'cesium'
import { ToolBaseOptions } from '@mo-yu/core'

export interface MapOption extends ToolBaseOptions {
  /**
   * 当前地图实例唯一id
   */
  id: string
  baseOption?: Viewer.ConstructorOptions
}

/**
 * 3DTile构造参数
 */
export type Cesium3DTilesetOption = ConstructorParameters<
  typeof Cesium3DTileset
>[0]

export interface Cesium3DTilesOffset {
  lng?: number
  lat?: number
  height?: number
  rx?: number
  ry?: number
  rz?: number
  scale?: number
}

/**
 * 位置信息
 */
export interface Position {
  lng: number
  lat: number
  height?: number
}

/**
 * 旋转参数
 * heading：偏航角
 * pitch：俯仰角
 * roll：翻滚角
 */
export interface Rotation {
  /**
   * 偏航角
   */
  heading?: number
  /**
   * 俯仰角
   */
  pitch?: number

  /**
   * 翻滚角
   */
  roll?: number
}

/**
 * 相机位置角度
 */
export type CameraParam = Partial<Position> & Partial<Rotation>

/**
 * 初始化cesium CESIUM_BASE_URL defaultAccessToken
 * @param baseURL CESIUM_BASE_URL
 * @param token defaultAccessToken
 */
export function initCesium(baseURL: string, token: string) {
  window.CESIUM_BASE_URL = baseURL
  Ion.defaultAccessToken = token
}

/**
 * @description: 世界坐标(笛卡尔空间直角坐标)转经纬度坐标(WGS84坐标系)
 * @param {Cartesian3} cartesian3
 * @param {boolean} withHeight
 * @return {*}
 */
export function cartesian3ToLngLat(
  cartesian3: Cartesian3,
  withHeight?: boolean
) {
  // const cartographic = Cartographic.fromCartesian(cartesian3)
  const cartographic = Ellipsoid.WGS84.cartesianToCartographic(cartesian3)
  const lat = CMath.toDegrees(cartographic.latitude)
  const lng = CMath.toDegrees(cartographic.longitude)
  const height = cartographic.height
  return withHeight ? [lng, lat, height] : [lng, lat]
}

export function getDefaultOptions(): Viewer.ConstructorOptions {
  return {
    sceneMode: SceneMode.SCENE3D,
    // 查找位置工具
    geocoder: false,
    // 首页位置
    homeButton: false,
    // 3d/2d 模式切换按钮
    sceneModePicker: false,
    // 图层选择按钮
    baseLayerPicker: false,
    // 右上角的帮助按钮
    navigationHelpButton: false,
    // 左下角的动画控件的显示
    animation: false,
    // 底部的时间轴
    timeline: false,
    // 右下角的全屏按钮
    fullscreenButton: false,
    // 选择指示器
    selectionIndicator: false,
    // 信息面板
    infoBox: false,
    // VR模式
    vrButton: false,
    // 导航说明
    navigationInstructionsInitiallyVisible: false,
    shadows: false,
    shouldAnimate: true
  }
}
