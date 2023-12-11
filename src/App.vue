<!--
 * @Author: alex
 * @Date: 2022-02-16 10:55:13
 * @LastEditTime: 2023-12-11 14:51:45
 * @LastEditors: zhouyinkui
 * @Description: App.vue
 * @FilePath: \sw-frontend\src\App.vue
-->
<template>
  <n-config-provider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme-overrides="customTheme"
  >
    <n-message-provider>
      <m-loading>
        <router-view />
      </m-loading>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider, zhCN, dateZhCN } from 'naive-ui'
import { MLoading } from '@mo-yu/vue'
import { customTheme } from './naive_theme'
</script>
