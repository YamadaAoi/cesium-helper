<!--
 * @Author: zhouyinkui
 * @Date: 2023-12-08 14:48:44
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-11 17:47:15
 * @Description: 3DTiles配置
-->
<template>
  <div class="tile-config">
    <CommonMap @loaded="onLoaded" />
    <template v-if="mapReady">
      <div class="edit-panel">
        <div v-for="(item, i) in tiles" :key="i" class="edit-item">
          <div class="edit-options">
            <div
              :class="[
                'edit-title',
                curConfigId === item.id ? 'edit-chosen' : ''
              ]"
            >
              <span class="edit-label" :title="item.name">{{ item.name }}</span>
            </div>
            <div class="config-option">
              <div
                :class="[
                  'option-btn',
                  curConfigId === item.id ? 'option-active' : ''
                ]"
                @click="editTile(item)"
              >
                编辑
              </div>
              <div class="option-btn" @click="toggleTile(item)">
                {{ hideTiles.includes(item.id) ? '显示' : '隐藏' }}
              </div>
              <div class="option-btn" @click="deleteTile(item.id)">删除</div>
            </div>
          </div>
          <div v-if="curConfigId === item.id" class="item-edit">
            <div class="form-row">
              <div class="form-label">
                <span>名</span>
                <span>称：</span>
              </div>
              <div class="form-input">
                <NInput
                  :value="item.name"
                  size="small"
                  @update:value="
                    val => {
                      tileChange(val, 'name', item.id, true)
                    }
                  "
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">
                <span>经</span>
                <span>度：</span>
              </div>
              <div class="form-input">
                <NInputNumber
                  :value="item.lng"
                  :show-button="false"
                  size="small"
                  @update:value="
                    val => {
                      tileChange(val, 'lng', item.id)
                    }
                  "
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">
                <span>纬</span>
                <span>度：</span>
              </div>
              <div class="form-input">
                <NInputNumber
                  :value="item.lat"
                  :show-button="false"
                  size="small"
                  @update:value="
                    val => {
                      tileChange(val, 'lat', item.id)
                    }
                  "
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">
                <span>高</span>
                <span>度：</span>
              </div>
              <div class="form-input">
                <NInputNumber
                  :value="item.height"
                  :show-button="false"
                  size="small"
                  @update:value="
                    val => {
                      tileChange(val, 'height', item.id)
                    }
                  "
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">
                <span>缩</span>
                <span>放：</span>
              </div>
              <div class="form-input">
                <NInputNumber
                  :value="item.scale"
                  :show-button="false"
                  size="small"
                  @update:value="
                    val => {
                      tileChange(val, 'scale', item.id)
                    }
                  "
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">
                <span>偏</span>
                <span>航</span>
                <span>角：</span>
              </div>
              <div class="form-input">
                <NSlider
                  :style="{ zoom: 1 / zoom }"
                  :value="item.heading"
                  :tooltip="false"
                  :max="360"
                  @update:value="
                    val => {
                      tileChange(val, 'heading', item.id)
                    }
                  "
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">
                <span>俯</span>
                <span>仰</span>
                <span>角：</span>
              </div>
              <div class="form-input">
                <NSlider
                  :style="{ zoom: 1 / zoom }"
                  :value="item.pitch"
                  :tooltip="false"
                  :max="360"
                  @update:value="
                    val => {
                      tileChange(val, 'pitch', item.id)
                    }
                  "
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">
                <span>翻</span>
                <span>滚</span>
                <span>角：</span>
              </div>
              <div class="form-input">
                <NSlider
                  :style="{ zoom: 1 / zoom }"
                  :value="item.roll"
                  :tooltip="false"
                  :max="360"
                  @update:value="
                    val => {
                      tileChange(val, 'roll', item.id)
                    }
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ShadowMode } from 'cesium'
import { NInput, NInputNumber, NSlider } from 'naive-ui'
import { isNumber } from '@mo-yu/core'
import { useRem } from '@mo-yu/vue'
import CommonMap from 'src/components/commonMap/CommonMap.vue'
import { MapTileImpl, TileInfo } from 'src/map/mapTool/mapTile/mapTileImpl'
import { Position } from 'src/map/mapViewAble'

const { zoom } = useRem()
const mapReady = ref(false)
const tiles = ref<TileInfo[]>([
  {
    id: '001',
    url: 'http://119.3.213.144:8090/open-data/yiling/tiles/tileset.json',
    name: '倾斜摄影'
  },
  {
    id: '002',
    url: 'http://localhost:9003/model/t2Myv6RYx/tileset.json',
    name: '虫情',
    lng: 111.52397822120717,
    lat: 30.700912408925433,
    height: 137.38149397410075,
    heading: 0,
    pitch: 0,
    roll: -32,
    scale: 1
  }
])
const curConfigId = ref('')
const hideTiles = ref<string[]>([])
let impl: MapTileImpl | undefined

function editTile(tile: TileInfo) {
  if (tile.id === curConfigId.value) {
    curConfigId.value = ''
  } else {
    curConfigId.value = tile.id
    impl?.locateTile(tile.id)
  }
}

function toggleTile(tile: TileInfo) {
  if (hideTiles.value.includes(tile.id)) {
    hideTiles.value = hideTiles.value.filter(m => m !== tile.id)
    impl?.toggleTile(tile.id, true)
  } else {
    hideTiles.value = hideTiles.value.concat(tile.id)
    impl?.toggleTile(tile.id, false)
  }
}

function deleteTile(id: string) {
  tiles.value = tiles.value.filter(item => item.id !== id)
  impl?.deleteTile(id)
  if (id === curConfigId.value) {
    curConfigId.value = ''
  }
}

function tileChange(
  val: any,
  key: keyof TileInfo,
  id: string,
  silent?: boolean
) {
  tiles.value = tiles.value.map((m: TileInfo) => {
    if (id === m.id) {
      const newTile: TileInfo = { ...m, [key]: val }
      if (!silent && isNumber(val)) {
        impl?.updateTile(key, newTile)
      }
      return newTile
    } else {
      return m
    }
  })
}

function modelPositionChange(id: string, position: Required<Position>) {
  tiles.value = tiles.value.map(m => {
    if (m.id === id) {
      return { ...m, ...position }
    } else {
      return m
    }
  })
}

function onLoaded() {
  mapReady.value = true
  impl = new MapTileImpl({ mapId: 'mainMapView' })
  impl.enable()
  impl.eventBus.on('position-change', e => {
    modelPositionChange(e.id, e.position)
  })
  impl.eventBus.on('tile-pick', e => {
    if (e.id) {
      impl?.locateTile(e.id)
      curConfigId.value = e.id
    }
  })

  tiles.value.forEach(tile => {
    impl?.add3DTileset(
      {
        url: tile.url,
        backFaceCulling: true,
        maximumScreenSpaceError: 16,
        maximumMemoryUsage: 512,
        cullWithChildrenBounds: true,
        dynamicScreenSpaceError: false,
        dynamicScreenSpaceErrorDensity: 0.00278,
        dynamicScreenSpaceErrorFactor: 4,
        dynamicScreenSpaceErrorHeightFalloff: 0.25,
        skipLevelOfDetail: true,
        baseScreenSpaceError: 1024,
        skipScreenSpaceErrorFactor: 16,
        skipLevels: 1,
        immediatelyLoadDesiredLevelOfDetail: false,
        loadSiblings: false,
        shadows: ShadowMode.ENABLED
      },
      {
        lng: tile.lng,
        lat: tile.lat,
        height: tile.height,
        rx: tile.heading,
        ry: tile.pitch,
        rz: tile.roll,
        scale: tile.scale
      },
      false,
      tile.id
    )
  })
}
</script>

<style scoped lang="scss">
.tile-config {
  width: 100%;
  height: 100%;
  position: relative;

  .edit-panel {
    width: 360px;
    height: 100%;
    padding: 12px;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 999;
    background: rgba(6, 30, 60, 0.8);
    border: 1px solid rgba(28, 73, 91, 1);
    box-shadow: 0 16px 30px 0 rgba(13, 42, 88, 0.69);
    border-radius: 4px;
    @include scrollHiddenBase();
    .edit-item {
      width: 100%;
      // margin-bottom: 0.04rem;
      .edit-options {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        .edit-title {
          width: 45%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          .edit-label {
            font-size: 0.18rem;
            font-family: Microsoft YaHei;
            color: #cffbff;
            @include textOver();
          }
        }
        .config-option {
          display: flex;
          align-items: center;
          justify-content: center;
          .option-btn {
            position: relative;
            white-space: nowrap;
            cursor: pointer;
            font-size: 0.16rem;
            font-family: Microsoft YaHei;
            color: #00eaff;
            margin: 0 0.05rem;
            display: flex;
            align-items: center;
            justify-content: center;
            &::after {
              content: '';
              width: 2px;
              height: 0.15rem;
              background-color: rgba(0, 234, 255, 0.45);
              @include centerY();
              right: -0.06rem;
            }
            &:last-of-type {
              &::after {
                display: none;
              }
            }
            &:hover {
              color: #fff196;
            }
          }
          .option-active {
            color: #fff196;
          }
          .color-pick {
            width: 28px;
          }
          .color-value {
            @include textOver();
          }
        }
        .edit-chosen {
          .edit-label {
            color: #fff196;
          }
        }
      }
      .item-edit {
        padding: 0.08rem;
        border-radius: 0.04rem;
        background-color: rgba(6, 30, 60, 0.8);
        .form-row {
          width: 100%;
          margin-bottom: 0.14rem;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          .form-label {
            width: calc(100% - 2.06rem);
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            @include textOver();
            font-size: 0.16rem;
            font-family: MicrosoftYaHei;
            color: #ecfdff;
          }
          .form-input {
            width: 2.06rem;
          }
        }
      }
    }
  }
}
</style>
