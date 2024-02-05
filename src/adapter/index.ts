/*
 * @Description:
 * @Date: 2022-08-08 11:11:08
 * @LastEditTime: 2024-01-11 11:29:30
 */
import { watch, watchEffect } from 'vue'
import isElectron from 'is-electron'
import BrowserChat from './browser'
import ElectronChat from './electron'
import type { ChatEvents } from './typing'
import store from '@/store'

// eslint-disable-next-line import/no-mutable-exports
export let chatEvents: Nullable<ChatEvents> = null

/**
 * 分发聊天事件类, 在不同的终端中, 使用不同的通讯方式
 * 所处终端包括: web 端, pc 端
 * NOTE: pc 端使用 electron 引用, 将会使用到 ipcRenderer 渲染进程通信等
 */
export function dispatch() {
  // electron端 和 浏览器端
  chatEvents = isElectron() ? new ElectronChat() : new BrowserChat()

  const { userList, mineUserInfo, privateMessage, getLogsFromStorage } = chatEvents

  // 获取全部历史聊天记录
  store.commit('SET_ALL_CHAT_HISTORY', getLogsFromStorage())

  watchEffect(() => {
    if (userList.value.length)
      store.commit('SET_USER_LIST', userList.value)

    if (mineUserInfo.value)
      store.commit('SET_USER_INFO', mineUserInfo.value)
  })

  watch(privateMessage, (val) => {
    console.log('收到聊天消息: ', val)
  })
}

