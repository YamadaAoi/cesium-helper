/*
 * @Author: zhouyinkui
 * @Date: 2023-12-07 13:42:36
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-13 16:42:31
 * @Description: 3DTiles工具
 */
import {
  Cartesian3,
  Cartographic,
  Ellipsoid,
  HeadingPitchRoll,
  IntersectionTests,
  Math,
  Matrix3,
  Matrix4,
  Plane,
  Quaternion,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Transforms,
  PrimitiveCollection,
  Cesium3DTileset,
  Cesium3DTileStyle,
  Cartesian2
} from 'cesium'
import {
  Position,
  Cesium3DTilesetOption,
  Cesium3DTilesOffset,
  CameraParam
} from '../../mapViewAble'
import { MapToolBase, MapToolBaseOptions } from '../mapToolBase'

export interface TileInfo extends CameraParam {
  id: string
  url: string
  name: string
  scale?: number
}

/**
 * 事件
 */
export interface MapTileImplEvents {
  'position-pick': {
    position: Required<Position>
  }
  'position-change': {
    id: string
    position: Required<Position>
  }
  'tile-pick': {
    id?: string
  }
}

export class MapTileImpl extends MapToolBase<
  MapToolBaseOptions,
  MapTileImplEvents
> {
  protected handler: ScreenSpaceEventHandler | undefined
  #tiles = new PrimitiveCollection()
  #style = new Cesium3DTileStyle({
    color: {
      conditions: [['true', 'color("red")']]
    }
  })
  constructor(options: MapToolBaseOptions) {
    super(options)
  }

  enable(): void {
    if (this.mapView?.mapIns) {
      const viewer = this.mapView.mapIns
      viewer.scene.primitives.add(this.#tiles)
      this.handler = new ScreenSpaceEventHandler(viewer.canvas)
      // 左键点击
      this.handler.setInputAction(
        (event: ScreenSpaceEventHandler.PositionedEvent) => {
          const picked = viewer.scene.pick(event.position)
          // console.log(picked)
          if (picked?.tileset) {
            // console.log(picked.getProperty('id'))
            this.eventBus.fire('tile-pick', {
              id: picked.tileset.busiId
            })
          }
          const position = this.getPosition(event.position)
          if (position) {
            const cartographic = Cartographic.fromCartesian(position)
            this.eventBus.fire('position-pick', {
              position: {
                lng: Math.toDegrees(cartographic.longitude),
                lat: Math.toDegrees(cartographic.latitude),
                height: cartographic.height
              }
            })
          }
        },
        ScreenSpaceEventType.LEFT_CLICK
      )
      // 左键调整横向位置
      this.handler.setInputAction(
        (event: ScreenSpaceEventHandler.PositionedEvent) => {
          const picked = viewer.scene.pick(event.position)
          if (picked?.tileset?.root?.transform) {
            viewer.scene.screenSpaceCameraController.enableRotate = false
            picked.tileset.style = this.#style
            this.handler?.setInputAction(
              (action: ScreenSpaceEventHandler.MotionEvent) => {
                // entity，primitive，3dtile上的点
                const position = this.getPosition(action.endPosition)
                if (position) {
                  const data = this.getPosiHPRScale(
                    picked.tileset.root.transform
                  )
                  const prev =
                    viewer.scene.globe.ellipsoid.cartesianToCartographic(
                      data[0]
                    )
                  const next =
                    viewer.scene.globe.ellipsoid.cartesianToCartographic(
                      position
                    )
                  next.height = prev.height
                  const translation =
                    viewer.scene.globe.ellipsoid.cartographicToCartesian(next)
                  const modelMatrix = this.createMatrix(
                    translation,
                    data[1],
                    data[2]
                  )
                  picked.tileset.root.transform = modelMatrix
                  this.eventBus.fire('position-change', {
                    id: picked.tileset.busiId,
                    position: {
                      lng: Math.toDegrees(next.longitude),
                      lat: Math.toDegrees(next.latitude),
                      height: next.height
                    }
                  })
                }
              },
              ScreenSpaceEventType.MOUSE_MOVE
            )
            this.handler?.setInputAction(() => {
              viewer.scene.screenSpaceCameraController.enableRotate = true
              picked.tileset.style = undefined
              this.handler?.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE)
              this.handler?.removeInputAction(ScreenSpaceEventType.LEFT_UP)
            }, ScreenSpaceEventType.LEFT_UP)
          }
        },
        ScreenSpaceEventType.LEFT_DOWN
      )
      // 右键调整纵向高度
      this.handler.setInputAction(
        (event: ScreenSpaceEventHandler.PositionedEvent) => {
          const picked = viewer.scene.pick(event.position)
          if (picked?.tileset?.root?.transform) {
            viewer.scene.screenSpaceCameraController.enableInputs = false
            picked.tileset.style = this.#style
            this.handler?.setInputAction(
              (action: ScreenSpaceEventHandler.MotionEvent) => {
                const ray = viewer.scene.camera.getPickRay(action.endPosition)
                if (ray) {
                  const data = this.getPosiHPRScale(
                    picked.tileset.root.transform
                  )
                  const diff = Cartesian3.subtract(
                    viewer.scene.camera.position,
                    data[0],
                    new Cartesian3()
                  )
                  const planeNormal = Cartesian3.normalize(diff, diff)
                  const plane = Plane.fromPointNormal(data[0], planeNormal)
                  const nextCartesian = IntersectionTests.rayPlane(ray, plane)
                  const next =
                    viewer.scene.globe.ellipsoid.cartesianToCartographic(
                      nextCartesian
                    )
                  const prev =
                    viewer.scene.globe.ellipsoid.cartesianToCartographic(
                      data[0]
                    )
                  prev.height = next.height
                  const translation =
                    viewer.scene.globe.ellipsoid.cartographicToCartesian(prev)
                  const modelMatrix = this.createMatrix(
                    translation,
                    data[1],
                    data[2]
                  )
                  picked.tileset.root.transform = modelMatrix
                  this.eventBus.fire('position-change', {
                    id: picked.tileset.busiId,
                    position: {
                      lng: Math.toDegrees(prev.longitude),
                      lat: Math.toDegrees(prev.latitude),
                      height: prev.height
                    }
                  })
                }
              },
              ScreenSpaceEventType.MOUSE_MOVE
            )
            this.handler?.setInputAction(() => {
              viewer.scene.screenSpaceCameraController.enableInputs = true
              picked.tileset.style = undefined
              this.handler?.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE)
              this.handler?.removeInputAction(ScreenSpaceEventType.LEFT_UP)
            }, ScreenSpaceEventType.RIGHT_UP)
          }
        },
        ScreenSpaceEventType.RIGHT_DOWN
      )
    }
  }

  destroy(): void {
    this.mapView?.mapIns.scene.primitives.add(this.#tiles)
    this.handler?.destroy()
    this.clear()
  }

  removeAllTiles() {
    this.#tiles.removeAll()
  }

  removeTile(primitive: any) {
    if (primitive) {
      this.#tiles.remove(primitive)
    }
  }

  clear() {
    this.eventBus.fire('tile-pick', {})
    this.removeAllTiles()
  }

  /**
   * 根据id获取tile
   * @param id
   * @returns
   */
  getTileById(id: string) {
    const len = this.#tiles.length
    let tile: Cesium3DTileset | undefined
    for (let i = 0; i < len; i++) {
      const p = this.#tiles.get(i)
      if (p.busiId === id) {
        tile = p
      }
    }
    return tile
  }

  locateTile(id: string) {
    const tile = this.getTileById(id)
    if (tile) {
      this.mapView?.mapIns
        .flyTo(tile, {
          duration: 1
        })
        .catch(err => {
          console.error(err)
        })
    }
  }

  toggleTile(id: string, show: boolean) {
    const tile = this.getTileById(id)
    if (tile) {
      tile.show = show
    }
  }

  deleteTile(id: string) {
    const tile = this.getTileById(id)
    if (tile) {
      this.#tiles.remove(tile)
    }
  }

  updateTile(key: keyof TileInfo, params: TileInfo) {
    const tile = this.getTileById(params.id)
    if (tile) {
      const data = this.getPosiHPRScale(tile.root.transform)
      if (['lng', 'lat', 'height'].includes(key)) {
        const translation = this.updateTranslation(data[0], params)
        const modelMatrix = this.createMatrix(translation, data[1], data[2])
        tile.root.transform = modelMatrix
        this.mapView?.mapIns.zoomTo(tile)
      } else if (['heading', 'pitch', 'roll'].includes(key)) {
        const hpr = this.updateHPR(data[1], params)
        const modelMatrix = this.createMatrix(data[0], hpr, data[2])
        tile.root.transform = modelMatrix
      } else if (key === 'scale') {
        const scale = this.createScale(params.scale)
        const modelMatrix = this.createMatrix(data[0], data[1], scale)
        tile.root.transform = modelMatrix
      }
    }
  }

  /**
   * 添加3DTile图层
   * @param option Cesium3DTileset构造函数入参
   * @param params 偏移旋转缩放
   * @param locate 是否定位
   * @param id 赋予ID
   */
  async add3DTileset(
    option: Cesium3DTilesetOption,
    params?: Cesium3DTilesOffset,
    locate?: boolean,
    id?: string
  ) {
    let primitive: any
    if (option) {
      const tileset = new Cesium3DTileset(option)
      const tile = await tileset.readyPromise
      if (params) {
        const modelMatrix = this.getTransform(tile.root.transform, params)
        tile.root.transform = modelMatrix
      }
      if (id) {
        ;(tile as any).busiId = id
      }
      primitive = this.#tiles.add(tile)
      if (locate && this.mapView?.mapIns) {
        await this.mapView.mapIns.zoomTo(tile)
      }
    }
    return primitive
  }

  getTransform(mat: Matrix4, params: Cesium3DTilesOffset) {
    const data = this.getPosiHPRScale(mat)
    const translation = this.updateTranslation(data[0], params)
    const hpr = this.updateHPR(data[1], params)
    const scale = this.createScale(params.scale)
    const modelMatrix = this.createMatrix(translation, hpr, scale)
    return modelMatrix
  }

  private updateTranslation(prev: Cartesian3, params: Cesium3DTilesOffset) {
    const cartographic = Cartographic.fromCartesian(prev)
    const translation = Cartesian3.fromDegrees(
      this.getDegree(cartographic.longitude, params.lng),
      this.getDegree(cartographic.latitude, params.lat),
      params.height !== undefined ? params.height : cartographic.height
    )
    return translation
  }

  private updateHPR(prev: HeadingPitchRoll, params: Cesium3DTilesOffset) {
    const hpr = new HeadingPitchRoll(
      Math.toRadians(this.getDegree(prev.heading, params.heading)),
      Math.toRadians(this.getDegree(prev.pitch, params.pitch)),
      Math.toRadians(this.getDegree(prev.roll, params.roll))
    )
    return hpr
  }

  private createScale(scaleXYZ?: number) {
    const x = scaleXYZ !== undefined ? scaleXYZ : 1
    const scale = new Cartesian3(x, x, x)
    return scale
  }

  private createMatrix(
    translation: Cartesian3,
    hpr: HeadingPitchRoll,
    scale: Cartesian3
  ) {
    const modelMatrix = Transforms.headingPitchRollToFixedFrame(
      translation,
      hpr,
      Ellipsoid.WGS84,
      Transforms.eastNorthUpToFixedFrame,
      new Matrix4()
    )
    Matrix4.multiplyByScale(modelMatrix, scale, modelMatrix)
    return modelMatrix
  }

  /**
   * 获取位置、旋转、 缩放信息
   * @param picked -
   * @returns
   */
  private getPosiHPRScale(
    mat: Matrix4
  ): [Cartesian3, HeadingPitchRoll, Cartesian3] {
    const scale = Matrix4.getScale(mat, new Cartesian3())
    const translation = Matrix4.getTranslation(mat, new Cartesian3())
    const m1 = Transforms.eastNorthUpToFixedFrame(
      translation,
      Ellipsoid.WGS84,
      new Matrix4()
    )
    const m3 = Matrix4.multiply(
      Matrix4.inverse(m1, new Matrix4()),
      mat,
      new Matrix4()
    )
    const mat3 = Matrix4.getRotation(m3, new Matrix3())
    const q = Quaternion.fromRotationMatrix(mat3)
    const hpr = HeadingPitchRoll.fromQuaternion(q)
    const headingPitchRoll = new HeadingPitchRoll(
      hpr.heading,
      hpr.pitch,
      hpr.roll
    )
    return [translation, headingPitchRoll, scale]
  }

  private getDegree(prev: number, next?: number) {
    return next !== undefined ? next : Math.toDegrees(prev)
  }

  private getPosition(endPosition: Cartesian2) {
    const viewer = this.mapView?.mapIns
    let position: Cartesian3 | undefined
    if (viewer) {
      // entity，primitive，3dtile上的点
      try {
        position = viewer.scene.pickPosition(endPosition)
      } catch (error) {
        console.error('不是entity，primitive，3dtile上的点', error)
      }
      if (!position) {
        const ray = viewer.camera.getPickRay(endPosition)
        if (ray) {
          // 地形上的点
          position = viewer.scene.globe.pick(ray, viewer.scene)
        }
      }
    }
    return position
  }
}
