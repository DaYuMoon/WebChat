/*
 * @Description:
 * @Date: 2022-08-06 00:48:21
 * @LastEditTime: 2023-07-06 10:27:51
 */
import Vue, { del, set } from 'vue'
import Vuex from 'vuex'

import { Message } from 'element-ui'
import type { MessageAlert, PrivateChatLogsHistory, SetAlertMegParams } from './typing'
import { chatEvents } from '@/adapter'
// WARM: 该 key 后续要改为 userId, 原为 id
export const MATCH_KEY: keyof UserInfo = 'userId'

Vue.use(Vuex)

export interface State {
  /**
   * 我的信息
   */
  userInfo: UserInfo
  /**
   * 用户列表
   */
  userList: UserInfo[]
  /**
   * 历史用户信息
   */
  historyUsers: HistoryUserInfo[]
  /**
   * 当前正在对话的用户 (会切换)
   */
  currentChatting: UserInfo
  /**
   * 当前正在对话的用户的聊天记录
   */
  currentChatLogs: SendPrivateChat[]
  /**
   * 所有聊天记录
   */
  chatHistory: PrivateChatLogsHistory
  /**
   * 新消息提示
   */
  messageAlert: MessageAlert
  /**
   * 最近发送的emoji
   */
  currentEmoji: string[]
}

const store = new Vuex.Store({
  state: (): State => ({
    userInfo: createDefineUserInfo(),
    userList: [],
    currentChatting: createDefineUserInfo(),
    currentChatLogs: [],
    chatHistory: {},
    messageAlert: {},
    historyUsers: [],
    currentEmoji: [],
  }),

  getters: {
    // 根据历史聊天记录匹配出离线的用户
    offlineHistoryUser: (state): HistoryUserInfo[] => {
      const offLineUsers = state.historyUsers.filter((history) => {
        const isOnline = state.userList.some(online => online[MATCH_KEY] === history[MATCH_KEY])
        return !isOnline
      })
      return offLineUsers
    },
  },

  mutations: {
    /**
     * 设置active信息
     */
    SET_MESSAGE_ALERT(state, data: SetAlertMegParams) {
      const { chatId, msgInfo } = data

      set(state.messageAlert, chatId, msgInfo)
    },
    SET_EMOJI_LIST(state, emojiList: string[]) {
      state.currentEmoji = emojiList
    },
    PUSH_CURRENT_EMOJI(state, emoji: string) {
      const max = 7

      const index = state.currentEmoji.findIndex(i => i === emoji)
      // 不存在则设置到第一位
      if (index === -1) {
        // 如果超过最大上限, 则清除最早的
        if (state.currentEmoji.length === max)
          state.currentEmoji.pop()
      }
      else {
        // 存在则需要将该表情移到第一位
        state.currentEmoji.splice(index, 1)
      }
      state.currentEmoji.unshift(emoji)
    },
    SET_HISTORY_USERS(state, users: HistoryUserInfo[]) {
      state.historyUsers = users
    },
    SET_CURRENT_CHATTING(state, userInfo: UserInfo) {
      state.currentChatting = userInfo

      // 设置当前对话人的对话记录
      state.currentChatLogs = state.chatHistory[userInfo[MATCH_KEY] || ''] || []

      // 如果有新消息提示, 取消
      if (userInfo[MATCH_KEY] in state.messageAlert)
        del(state.messageAlert, userInfo[MATCH_KEY])
    },
    SET_USER_INFO(state, userInfo: UserInfo) {
      state.userInfo = userInfo
    },
    SET_USER_LIST(state, userList: UserInfo[]) {
      state.userList = userList

      // 刷新用户列表后, 有可能用户下线了然后重新上线(此时 socket.id 会刷新, 需要以 userId 为基准)
      const userId = state.currentChatting[MATCH_KEY]
      const currentChatting = userList.find(user => user[MATCH_KEY] === userId)
      if (currentChatting)
        state.currentChatting = currentChatting
    },

    /**
     * 删除当前聊天对话中的单条聊天内容 (针对与当前聊天的)
     * @param msgInfo - 聊天信息详情
     */
    DEL_CUR_CHAT_LOG(state, msgInfo: SendPrivateChat) {
      const { userId } = state.currentChatting
      const { time, msg } = msgInfo
      console.log(msgInfo, state.currentChatLogs)
      // NOTE: 目前是根据消息发送时间来删除
      if (time) {
        for (const index in state.currentChatLogs) {
          const { time: logTime, msg: logMsg } = state.currentChatLogs[index]
          if (logTime === time && logMsg === msg) {
            state.currentChatLogs.splice(Number(index), 1)
            break
          }
        }

        // 设置全局历史聊天内容 (storage)
        state.chatHistory[userId] = state.currentChatLogs

        // 设置到 storage 中
        chatEvents?.setLogsToStorage()
      }

      else { Message.error('删除聊天内容失败!') }
    },

    /**
     * 单个设置
     * @param state
     * @param msgInfo
     */
    SET_CHAT_HISTORY(state, msgInfo: SendPrivateChat) {
      const { toUser, fromUser } = msgInfo

      const isChatToMyself = (toUser[MATCH_KEY] && fromUser[MATCH_KEY]) && toUser[MATCH_KEY] === fromUser[MATCH_KEY]

      // 获取对话的 id
      const chatId = isChatToMyself ? state.userInfo[MATCH_KEY] : toUser[MATCH_KEY] === state.userInfo[MATCH_KEY] ? fromUser[MATCH_KEY] : toUser[MATCH_KEY]

      // 是否存在过交流的记录
      const hadTalk = chatId in state.chatHistory

      // 存储对话记录到所有对话用户历史记录中
      if (hadTalk) { state.chatHistory[chatId].push(msgInfo) }
      else {
        // NOTE: 行为差异 (与 vue3.x 不同)

        // 1. vue3基于 Proxy api, 所以下面这行可以执行
        // state.chatHistory[chatId] = [msgInfo]

        // 2. vue2还是采用 defineProperty , 在更新时, 需要手动 set 一下, 因为初始值有可能为空, 没有收集依赖, 需要重新 set 一下更新并收集依赖
        set(state.chatHistory, chatId, [msgInfo])
      }

      // 判断是否 正在对话中
      const matchCurrentChat = state.currentChatting[MATCH_KEY] === toUser[MATCH_KEY] || state.currentChatting[MATCH_KEY] === fromUser[MATCH_KEY]
      // 取出当前对话记录
      if (matchCurrentChat) {
        const currentChatLogs = state.chatHistory[state.currentChatting[MATCH_KEY] || ''] || []
        state.currentChatLogs = currentChatLogs
      }

      // NOTE: 抓取 - 新消息提示
      // 是否为对话发送给自己的
      const talkToMyself = state.currentChatting[MATCH_KEY] === toUser[MATCH_KEY] && state.currentChatting[MATCH_KEY] === fromUser[MATCH_KEY]
      // 接收的消息是否不来自于当前对话人, 且消息发送人不是本机用户
      const isReceivedNotCurrentChat = fromUser[MATCH_KEY] !== state.currentChatting[MATCH_KEY] && fromUser[MATCH_KEY] !== state.userInfo[MATCH_KEY]

      if (!talkToMyself) {
        // 当新消息对话者不是当前对话用户时, 设置未读消息提示
        const item = { lastMessage: msgInfo.msg, time: msgInfo?.time || 0 }

        if (isReceivedNotCurrentChat)
          set(state.messageAlert, chatId, item)

        const messageSender = state.userList.find(user => user.userId === chatId) as UserInfo

        // 消息提醒 (mp3 播放或其他)
        chatEvents?.alertNewMessage(state.messageAlert, Object.assign({ chatId, sender: messageSender }, item))
      }
    },
    /**
     * 设置全部历史记录(强覆盖性)
     */
    SET_ALL_CHAT_HISTORY(state, history: PrivateChatLogsHistory) {
      state.chatHistory = history
    },
  },

  actions: {
    handleCurrentEmoji(ctx, type: 'set' | 'get') {
      const key = 'local-current-emoji-list'
      /**
       * 占位符
       */
      const PLACEHOLDER = ' '
      if (type === 'set') {
        // 将"最近使用的emoji" 保存至 localStorage 中
        localStorage.setItem(key, ctx.state.currentEmoji.join(PLACEHOLDER))
      }
      else {
        // 从 localStorage 中取出 emoji
        const emojis = localStorage.getItem(key)
        let emojiList: string[] = []

        if (emojis)
          emojiList = emojis.split(PLACEHOLDER)
        else emojiList = []

        ctx.commit('SET_EMOJI_LIST', emojiList)
      }
    },
  },
})

/**
 * 生成默认的用户信息
 * @returns
 */
function createDefineUserInfo(): UserInfo {
  return {
    nickname: null,
    ip: '',
    id: '',
    userId: '',
    port: null,
    using: false,
  }
}

export default store
