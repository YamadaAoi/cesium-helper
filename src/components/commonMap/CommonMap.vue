<!--
 * @Author: zhouyinkui
 * @Date: 2022-07-20 09:14:38
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-12 14:17:04
 * @Description: 
 * Copyright (c) 2022 by piesat, All Rights Reserved. 
-->
<template>
  <div class="common-map">
    <div :id="props.mapId" class="cesium-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import 'cesiumcss'
import { createWorldTerrain } from 'cesium'
import { MapView } from '../../map/mapViewImpl'

const props = withDefaults(
  defineProps<{
    mapId?: string
  }>(),
  {
    mapId: 'mainMapView'
  }
)
const mapReady = ref(false)
const emits = defineEmits<{
  (e: 'loaded', id: string): void
  (e: 'removed'): void
}>()

let map: MapView

onMounted(() => {
  map = new MapView(props.mapId, {
    id: props.mapId
  })
  map.mapIns.terrainProvider = createWorldTerrain()
  map.eventBus.once('ready', e => {
    mapReady.value = true
    emits('loaded', e.view?.id)
  })
})

onUnmounted(() => {
  map?.remove()
  emits('removed')
})
</script>

<style scoped lang="scss">
.common-map {
  width: 100%;
  height: 100%;
  position: relative;

  .cesium-container {
    width: 100%;
    height: 100%;
  }
}
</style>
