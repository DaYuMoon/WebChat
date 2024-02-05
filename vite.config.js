/*
 * @Description:
 * @Date: 2022-07-26 01:43:10
 * @LastEditTime: 2024-01-11 12:28:08
 */
import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import WindiCSS from 'vite-plugin-windicss'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite'
import { webUpdateNotice } from '@plugin-web-update-notification/vite'
// import vueSetupExtend from 'unplugin-vue-setup-extend-plus/vite'

const prod = process.env.NODE_ENV === 'production'

const config = defineConfig({
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
      '@public': `${path.resolve(__dirname, 'public')}`,
      'v-contextmenu-directive': `${path.resolve(__dirname, 'src/custom-libs/v-contextmenu-directive/src/contextmenu/index.js')}`,
    },
  },

  base: './',

  build: {
    minify: true,
    assetsDir: prod ? './' : './',
  },

  plugins: [
    vue(),
    WindiCSS(),
    // vueSetupExtend(),
    webUpdateNotice({
      versionType: 'build_timestamp',
      logVersion: true,
    }),
    Components({
      resolvers: [
        IconsResolver(
          {
            prefix: false,
            enabledCollections: ['emojione-v1', 'carbon', 'jam', 'material-symbols', 'clarity', 'wpf', 'bi', 'mdi', 'emojione'],
          },

        ),
      ],
      dts: 'src/components.d.ts',
    }),
    Icons({ autoInstall: true }),
    AutoImport({
      imports: [
        '@vueuse/core',
      ],
      dts: 'src/auto-imports.d.ts',
    }),
  ],

  server: {
    port: 3333,
    host: '0.0.0.0',
  },

  optimizeDeps: {
    entries: '',
  },
})

export default config
