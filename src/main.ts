/*
 * @Description:
 * @Date: 2022-07-26 01:43:10
 * @LastEditTime: 2024-02-05 10:40:14
 */
import Vue from 'vue'
// import { Notification } from 'element-ui'

import 'windi.css'
import router from '@/router'
import store from '@/store'

import '@/utils/register-element'
import 'element-ui/lib/theme-chalk/index.css'
import '@/assets/global.scss'

// 引入右键菜单组件
// import 'v-contextmenu-directive/dist/v-contextmenu-directive.css'
import '@/custom-libs/v-contextmenu-directive/assets/v-contextmenu-directive.css'

// @ts-ignore
// eslint-disable-next-line import/order
import Contextmenu from 'v-contextmenu-directive'

import App from '@/App.vue'

Vue.use(Contextmenu)

Vue.config.productionTip = false
Vue.config.devtools = true

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
})

