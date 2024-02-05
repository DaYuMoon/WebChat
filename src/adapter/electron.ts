/*
 * @Description: 处于 electron 时的适配器
 * @Date: 2022-08-08 10:36:25
 * @LastEditTime: 2024-01-11 11:28:20
 */
import { nextTick } from 'vue'
import { ChatEvents } from './typing'
import type { SocketInstance } from '@/hooks/socket'
import type { CurrentChatMsg, MessageAlert, PrivateChatLogsHistory } from '@/store/typing'
import store from '@/store'
import { connect as connectSocket, getSocketClientInstance } from '@/hooks/socket'
import { getUserId } from '@/utils/common'
import { getNickname } from '@/utils/user'

export default class ElectronChat extends ChatEvents {
  socket: Nullable<SocketInstance> = null

  protected ipcRenderer: Electron.IpcRenderer

  constructor() {
    super('electron')

    this.ipcRenderer = window.moonElectronBridge.getIpcRenderer()

    this.bridgeAcceptUserInfo()
    this.bridgeEmitGetUserInfo()
    this.bridgeOpenByNotifyWin()
  }

  /**
   * 断线重连调这个方法
   */
  handleReconnect() {
    this.socket = getSocketClientInstance()
    this.getUserList()
    this.getUserInfo()
  }

  /**
   * 桥接通知获取 userInfo (渲染进程触发)
   */
  bridgeEmitGetUserInfo() {
    this.ipcRenderer.send('chat-bridge-toLiveServer-getUserInfo')
  }

  /**
   * 桥接通知获取聊天的用户信息 userInfo (渲染进程监听)
   */
  bridgeAcceptUserInfo() {
    this.ipcRenderer.on('get-chat-userInfo', (e: any, userInfo: Partial<UserInfo>) => {
      console.log('userInfo', userInfo)

      // 连接 socket
      this.connect(userInfo)
    })
  }

  /**
   * 收到主进程通知
   * @description 主进程提示, 通过点击右下角"新消息提示"窗口进入, 此时需要调整当前对话人
   */
  bridgeOpenByNotifyWin() {
    this.ipcRenderer.on('open-by-notify-win', (e: any, currentChat: CurrentChatMsg) => {
      // console.log(currentChat)
      const currentChatUser = store.state.historyUsers.find((historyUser) => {
        return historyUser.userId === currentChat.chatId && currentChat.sender.id === historyUser.id
      })

      // console.log(currentChatUser)
      // console.log(store.state.historyUsers)

      if (currentChatUser)
        store.commit('SET_CURRENT_CHATTING', currentChatUser)
    })
  }

  /**
   * 初始化 socket 的 on 监听事件
   */
  initSocketMessage() {
    if (this.socket) {
      this.socket.on('get-userList', (userList) => {
        this.userList.value = userList

        // 获取历史用户
        this.socket?.emit('get-all-userList')
      })

      this.socket.on('get-all-userList', (userList) => {
        store.commit('SET_HISTORY_USERS', userList)
      })

      this.socket.on('get-userInfo', (mineUserInfo) => {
        console.log('userInfo: ', mineUserInfo)
        this.mineUserInfo.value = mineUserInfo
      })

      this.getUserList()
      this.getUserInfo()
      this.acceptMessage()
    }
  }

  async connect(userInfo: Partial<UserInfo>) {
    const { nickname } = userInfo

    // 本地设置的用户信息
    const localNickName = getNickname()

    await connectSocket(localNickName || nickname || '')

    this.socket = getSocketClientInstance()

    this.initSocketMessage()
  }

  getUserInfo() {
    this.socket?.emit('get-userInfo')
  }

  getUserList() {
    this.socket?.emit('get-userList')
  }

  getAllUserList() {
    this.socket?.emit('get-all-userList')
  }

  acceptMessage() {
    this.socket?.on('send-private-chat', (msgInfo) => {
      console.log(`来自${msgInfo.fromUser.ip || msgInfo.fromUser.nickname}的消息: ${msgInfo.msg}`)

      this.privateMessage.value = msgInfo.msg

      store.commit('SET_CHAT_HISTORY', msgInfo)

      nextTick(() => {
        this.setLogsToStorage()
      })
    })
  }

  sendPrivateMessage(msgInfo: SendPrivateChat) {
    this.socket?.emit('send-private-chat', msgInfo)
  }

  /**
   * TODO: 目前使用 localStorage , 受内存大小、访问限制, 后续需迁移至 indexedDb
   */
  setLogsToStorage(): void {
    const userId = getUserId()
    localStorage.setItem(userId, JSON.stringify(store.state.chatHistory))
  }

  /**
   * TODO: 目前使用 localStorage , 受内存大小、访问限制, 后续需迁移至 indexedDb
   */
  getLogsFromStorage(): PrivateChatLogsHistory {
    const userId = getUserId()
    try {
      const storageHistoryLogs = localStorage.getItem(userId)

      let normalizeLogs = {}

      if (storageHistoryLogs)
        normalizeLogs = JSON.parse(storageHistoryLogs)

      return normalizeLogs
    }
    catch (e) {
      console.log(e)
      return {}
    }
  }

  /**
   * 通知主进程进行消息提示
   */
  alertNewMessage(total: MessageAlert, current: CurrentChatMsg): void {
    this.ipcRenderer.send('chat-notifyMessage', { total, current })
  }
}
