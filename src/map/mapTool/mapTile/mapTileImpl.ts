/*
 * @Author: zhouyinkui
 * @Date: 2023-12-07 13:42:36
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-11 17:37:13
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
  Cesium3DTileStyle
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
  'position-change': {
    id: string
    position: Required<Position>
  }
  'tile-pick': {
    point?: [number, number, number?]
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
          // entity，primitive，3dtile上的点
          let position: Cartesian3 | undefined = viewer.scene.pickPosition(
            event.position
          )
          if (!position) {
            const ray = viewer.camera.getPickRay(event.position)
            if (ray) {
              // 地形上的点
              position = viewer.scene.globe.pick(ray, viewer.scene)
            }
          }
          if (picked?.tileset && position) {
            console.log(picked)
            // console.log(picked.getProperty('id'))
            console.log(picked)
            const cartographic = Cartographic.fromCartesian(position)
            this.eventBus.fire('tile-pick', {
              point: [
                Math.toDegrees(cartographic.longitude),
                Math.toDegrees(cartographic.latitude),
                cartographic.height
              ],
              id: picked.id
            })
          }
        },
        ScreenSpaceEventType.LEFT_CLICK
      )
      // 左键调整横向位置
      this.handler.setInputAction(
        (action: ScreenSpaceEventHandler.PositionedEvent) => {
          const picked = viewer.scene.pick(action.position)
          if (picked?.tileset?.root?.transform) {
            viewer.scene.screenSpaceCameraController.enableRotate = false
            picked.tileset.style = this.#style
            this.handler?.setInputAction(
              (action: ScreenSpaceEventHandler.MotionEvent) => {
                // entity，primitive，3dtile上的点
                let position: Cartesian3 | undefined =
                  viewer.scene.pickPosition(action.endPosition)
                if (!position) {
                  const ray = viewer.camera.getPickRay(action.endPosition)
                  if (ray) {
                    // 地形上的点
                    position = viewer.scene.globe.pick(ray, viewer.scene)
                  }
                }
                if (position) {
                  const nextCartographic =
                    viewer.scene.globe.ellipsoid.cartesianToCartographic(
                      position
                    )
                  const [prevCartesian, headingPitchRoll] = this.getPosiHPR(
                    picked.tileset.root.transform
                  )
                  const prevCartographic =
                    viewer.scene.globe.ellipsoid.cartesianToCartographic(
                      prevCartesian
                    )
                  nextCartographic.height = prevCartographic.height
                  const cartesianWithNewHeight =
                    viewer.scene.globe.ellipsoid.cartographicToCartesian(
                      nextCartographic
                    )
                  const modelMatrix = Transforms.headingPitchRollToFixedFrame(
                    cartesianWithNewHeight,
                    headingPitchRoll,
                    Ellipsoid.WGS84,
                    Transforms.eastNorthUpToFixedFrame,
                    new Matrix4()
                  )
                  picked.tileset.root.transform = modelMatrix
                  this.eventBus.fire('position-change', {
                    id: picked.tileset.busiId,
                    position: {
                      lng: Math.toDegrees(nextCartographic.longitude),
                      lat: Math.toDegrees(nextCartographic.latitude),
                      height: nextCartographic.height
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
        (action: ScreenSpaceEventHandler.PositionedEvent) => {
          const picked = viewer.scene.pick(action.position)
          if (picked?.tileset?.root?.transform) {
            viewer.scene.screenSpaceCameraController.enableInputs = false
            picked.tileset.style = this.#style
            this.handler?.setInputAction(
              (action: ScreenSpaceEventHandler.MotionEvent) => {
                const ray = viewer.scene.camera.getPickRay(action.endPosition)
                if (ray) {
                  const [prevCartesian, headingPitchRoll] = this.getPosiHPR(
                    picked.tileset.root.transform
                  )
                  const prevCartographic =
                    viewer.scene.globe.ellipsoid.cartesianToCartographic(
                      prevCartesian
                    )
                  const diff = Cartesian3.subtract(
                    viewer.scene.camera.position,
                    prevCartesian,
                    new Cartesian3()
                  )
                  const planeNormal = Cartesian3.normalize(diff, diff)
                  const plane = Plane.fromPointNormal(
                    prevCartesian,
                    planeNormal
                  )
                  const nextCartesian = IntersectionTests.rayPlane(ray, plane)
                  const nextCartographic =
                    viewer.scene.globe.ellipsoid.cartesianToCartographic(
                      nextCartesian
                    )
                  prevCartographic.height = nextCartographic.height
                  const cartesianWithNewHeight =
                    viewer.scene.globe.ellipsoid.cartographicToCartesian(
                      prevCartographic
                    )
                  const modelMatrix = Transforms.headingPitchRollToFixedFrame(
                    cartesianWithNewHeight,
                    headingPitchRoll,
                    Ellipsoid.WGS84,
                    Transforms.eastNorthUpToFixedFrame,
                    new Matrix4()
                  )
                  picked.tileset.root.transform = modelMatrix
                  this.eventBus.fire('position-change', {
                    id: picked.tileset.busiId,
                    position: {
                      lng: Math.toDegrees(prevCartographic.longitude),
                      lat: Math.toDegrees(prevCartographic.latitude),
                      height: prevCartographic.height
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

  clear() {
    this.eventBus.fire('tile-pick', {})
    this.removeAllTiles()
  }

  locateTile(id: string) {
    const tile = this.getTileById(id)
    if (tile) {
      this.mapView?.mapIns.zoomTo(tile).catch(err => {
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
      const data = this.getPosiHPR(tile.root.transform)
      if (['lng', 'lat', 'height'].includes(key)) {
        const cartographic = Cartographic.fromCartesian(data[0])
        const position = Cartesian3.fromDegrees(
          params.lng !== undefined
            ? params.lng
            : Math.toDegrees(cartographic.longitude),
          params.lat !== undefined
            ? params.lat
            : Math.toDegrees(cartographic.latitude),
          params.height !== undefined ? params.height : cartographic.height
        )
        const modelMatrix = Transforms.headingPitchRollToFixedFrame(
          position,
          data[1],
          Ellipsoid.WGS84,
          Transforms.eastNorthUpToFixedFrame,
          new Matrix4()
        )
        ;(tile.root as any).customTransform = modelMatrix.clone()
        tile.root.transform = modelMatrix
      } else if (['heading', 'pitch', 'roll'].includes(key)) {
        const hpr = new HeadingPitchRoll(
          Math.toRadians(
            params.heading !== undefined
              ? params.heading
              : Math.toDegrees(data[1].heading)
          ),
          Math.toRadians(
            params.pitch !== undefined
              ? params.pitch
              : Math.toDegrees(data[1].pitch)
          ),
          Math.toRadians(
            params.roll !== undefined
              ? params.roll
              : Math.toDegrees(data[1].roll)
          )
        )
        const modelMatrix = Transforms.headingPitchRollToFixedFrame(
          data[0],
          hpr,
          Ellipsoid.WGS84,
          Transforms.eastNorthUpToFixedFrame,
          new Matrix4()
        )
        ;(tile.root as any).customTransform = modelMatrix.clone()
        tile.root.transform = modelMatrix
      } else if (key === 'scale') {
        let modelMatrix = (tile.root as any).customTransform?.clone()
        if (!modelMatrix) {
          ;(tile.root as any).customTransform = tile.root.transform.clone()
          modelMatrix = tile.root.transform.clone()
        }
        const scale = Matrix4.fromUniformScale(
          params.scale !== undefined ? params.scale : 1
        )
        Matrix4.multiply(modelMatrix, scale, modelMatrix)
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
        const modelMatrix = this.getTransform(tile, params)
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

  getTransform(tile: Cesium3DTileset, params: Cesium3DTilesOffset) {
    const [cartesian, headingPitchRoll] = this.getPosiHPR(tile.root.transform)
    // const boundingSphere = tile.boundingSphere
    // const cartographic = Cartographic.fromCartesian(boundingSphere.center)
    const cartographic = Cartographic.fromCartesian(cartesian)
    const offset = Cartesian3.fromDegrees(
      params.lng !== undefined
        ? params.lng
        : Math.toDegrees(cartographic.longitude),
      params.lat !== undefined
        ? params.lat
        : Math.toDegrees(cartographic.latitude),
      params.height !== undefined ? params.height : cartographic.height
    )
    const modelMatrix = Transforms.eastNorthUpToFixedFrame(offset)
    // 缩放
    const scale = Matrix4.fromUniformScale(
      params.scale !== undefined ? params.scale : 1
    )
    Matrix4.multiply(modelMatrix, scale, modelMatrix)
    // 旋转
    const mx = Matrix3.fromRotationX(
      Math.toRadians(
        params.rx !== undefined
          ? params.rx
          : Math.toDegrees(headingPitchRoll.heading)
      )
    )
    const rotationX = Matrix4.fromRotationTranslation(mx)
    Matrix4.multiply(modelMatrix, rotationX, modelMatrix)
    const my = Matrix3.fromRotationY(
      Math.toRadians(
        params.ry !== undefined
          ? params.ry
          : Math.toDegrees(headingPitchRoll.heading)
      )
    )
    const rotationY = Matrix4.fromRotationTranslation(my)
    Matrix4.multiply(modelMatrix, rotationY, modelMatrix)
    const mz = Matrix3.fromRotationZ(
      Math.toRadians(
        params.rz !== undefined
          ? params.rz
          : Math.toDegrees(headingPitchRoll.heading)
      )
    )
    const rotationZ = Matrix4.fromRotationTranslation(mz)
    Matrix4.multiply(modelMatrix, rotationZ, modelMatrix)
    return modelMatrix
  }

  /**
   * 获取位置、旋转信息
   * @param picked -
   * @returns
   */
  private getPosiHPR(mat: Matrix4): [Cartesian3, HeadingPitchRoll] {
    const cartesian = Matrix4.getTranslation(mat, new Cartesian3())
    const m1 = Transforms.eastNorthUpToFixedFrame(
      cartesian,
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
    return [cartesian, headingPitchRoll]
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

  removeAllTiles() {
    this.#tiles.removeAll()
  }

  removeTile(primitive: any) {
    if (primitive) {
      this.#tiles.remove(primitive)
    }
  }
}
