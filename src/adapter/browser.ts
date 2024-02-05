/*
 * @Description:
 * @Date: 2022-08-08 11:12:56
 * @LastEditTime: 2024-01-11 11:27:01
 */
import { nextTick } from 'vue'
import { ChatEvents } from './typing'
import store from '@/store'
import type { SocketInstance } from '@/hooks/socket'
import { connect as connectSocket, getSocketClientInstance } from '@/hooks/socket'
import type { PrivateChatLogsHistory } from '@/store/typing'
import { getUserId } from '@/utils/common'
import { NotifyMp4Message } from '@/hooks/message-notify'
import { getNickname } from '@/utils/user'

export default class BrowserChat extends ChatEvents {
  socket: Nullable<SocketInstance> = null

  constructor() {
    super('browser')

    this.connect()
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
        // TODO: 这里短时间内有多次触发, 后面需要优化
        this.mineUserInfo.value = mineUserInfo
      })

      this.getUserList()
      // 其实服务端已经主动推送过一次了, 不过为了确保延时原因, 这里等连接成功后, 再手动获取一次用户新信息
      this.getUserInfo()
      this.acceptMessage()
    }
  }

  /**
   * 断线重连
   */
  handleReconnect() {
    this.socket = getSocketClientInstance()
    this.getUserList()
    this.getUserInfo()
  }

  async connect() {
    await connectSocket(getNickname())

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

  alertNewMessage(): void {
    NotifyMp4Message()
  }

  // applySendPrivateFiles(msgInfo: SendPrivateChat) {
  //   this.socket?.emit('private-send-files', msgInfo)
  // }

  // acceptSendPrivateFiles() {
  //   this.socket?.on('private-send-files', (msgInfo) => {

  //   })
  // }
}
