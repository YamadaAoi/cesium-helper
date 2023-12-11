/*
 * @Author: zhouyinkui
 * @Date: 2022-02-23 18:12:06
 * @LastEditors: zhouyinkui
 * @LastEditTime: 2023-12-01 14:28:13
 * @Description: vite配置
 */
import path from 'path'
import { defineConfig, loadEnv, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import pxtorem from 'postcss-pxtorem'
import postcssPresetEnv from 'postcss-preset-env'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import checker from 'vite-plugin-checker'
import strip from '@rollup/plugin-strip'
import viteCompression from 'vite-plugin-compression'

/**
 * @description: 获取Browsers配置
 * @param {*} command
 * @return {*}
 */
function getBrowsers(command: 'build' | 'serve') {
  return command === 'serve'
    ? [
        'last 1 chrome version',
        'last 1 firefox version',
        'last 1 safari version'
      ]
    : ['ie > 8', '>1%', 'not dead', 'not op_mini all']
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  loadEnv(mode, process.cwd())
  const config: UserConfig = {
    envPrefix: ['VITE_', 'CESIUM_'],
    plugins: [vue(), vueJsx()],
    resolve: {
      alias: {
        src: path.resolve(__dirname, './src'),
        cesiumcss: path.resolve(
          __dirname,
          'node_modules/cesium/Build/Cesium/Widgets/widgets.css'
        )
      }
    },
    css: {
      postcss: {
        plugins: [
          pxtorem({
            rootValue: 100,
            unitPrecision: 5,
            propList: ['*'],
            selectorBlackList: [],
            replace: true,
            mediaQuery: false,
            minPixelValue: 10
            // exclude: (file: string) => {
            //   const regs = [/node_modules/i, /src\/views\/other/i]
            //   return regs.some(reg => reg.test(file))
            // }
          }),
          postcssPresetEnv({
            browsers: getBrowsers(command)
          }) as any
        ]
      },
      preprocessorOptions: {
        scss: {
          additionalData: '@import "./src/assets/vars.scss";'
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              const arr1 = id.toString().split('node_modules/')
              const arr2 = arr1[arr1.length - 1].split('/')
              switch (arr2[0]) {
                case '@vue':
                case 'vue-router':
                case 'naive-ui':
                case '@mo-yu':
                case 'pinia':
                  return 'vendor_' + arr2[0]
                default:
                  return 'vendor'
              }
            }
          }
        }
      }
    }
  }
  if (config.plugins?.length) {
    if (command === 'serve') {
      config.server = {
        open: true
      }
      config.plugins?.push(
        checker({
          vueTsc: true
        }),
        viteStaticCopy({
          targets: [
            {
              src: [
                'node_modules/cesium/Build/Cesium/Workers',
                'node_modules/cesium/Build/Cesium/ThirdParty',
                'node_modules/cesium/Source/Assets',
                'node_modules/cesium/Source/Widgets'
              ],
              dest: 'cesium'
            }
          ]
        })
      )
    } else {
      config.plugins?.push(
        viteStaticCopy({
          targets: [
            {
              src: [
                'node_modules/cesium/Build/Cesium/Workers',
                'node_modules/cesium/Build/Cesium/ThirdParty',
                'node_modules/cesium/Build/Cesium/Assets',
                'node_modules/cesium/Build/Cesium/Widgets'
              ],
              dest: 'cesium'
            }
          ]
        }),
        strip(),
        viteCompression({
          filter: /\.(js|mjs|json|css|html|ttf)$/i
        })
      )
    }
  }
  return config
})
