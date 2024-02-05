/*
 * @Description: 将 vue-router 封装成 vue-router4.x 中的函数式风格 (使其能在 setup 中使用)
 * @Date: 2022-09-26 11:26:33
 * @LastEditTime: 2022-09-26 11:51:51
 */
import { getCurrentInstance, shallowRef } from 'vue'
import type { Route, VueRouter } from 'vue-router/types/router'
import router from '@/router'

export function useRouter(): VueRouter | undefined {
  const vm = getCurrentInstance()

  if (!vm) {
    console.warn('useRoute 必须在 setup 中使用')
    return undefined
  }

  return router
}

const currentRoute = shallowRef<Route>()

export function useRoute() {
  if (!currentRoute.value) {
    const vm = getCurrentInstance()

    if (!vm) {
      console.warn('useRouter 必须在 setup 中使用')
      return undefined
    }

    currentRoute.value = vm.proxy.$route

    const router = useRouter();

    // 每次路由切换时，更新 route 参数
    (router as VueRouter).afterEach((to) => {
      // to and from are both route objects.
      currentRoute.value = to
    })
  }

  return currentRoute.value
}
