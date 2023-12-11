<!--
 * @Author: zhouyinkui
 * @Date: 2023-12-01 11:05:29
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-01 14:13:52
 * @Description: 
-->
<template>
  <div class="portal">
    <CommonMap />
  </div>
</template>

<script setup lang="ts">
import CommonMap from 'src/components/commonMap/CommonMap.vue'
</script>

<style scoped lang="scss">
.portal {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
