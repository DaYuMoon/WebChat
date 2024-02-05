/*
 * @Description:
 * @Date: 2023-04-23 14:40:08
 * @LastEditTime: 2023-04-23 14:53:30
 */
import Vue from 'vue'
import App from './App.vue'

import Contextmenu from './contextmenu'
Vue.use(Contextmenu)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
