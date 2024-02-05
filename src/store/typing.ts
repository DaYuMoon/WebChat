/*
 * @Description: store 类型声明
 * @Date: 2022-08-08 10:21:08
 * @LastEditTime: 2023-03-03 11:35:00
 */

/**
 * 历史聊天记录对象
 */
export interface PrivateChatLogsHistory {
  [userId: string]: SendPrivateChat[]
}

export interface LatestMessage {
  lastMessage: string
  time: number
}

export interface MessageAlert {
  [userId: string]: LatestMessage
}

export type CurrentChatMsg = LatestMessage & { chatId: string; sender: UserInfo }

export interface SetAlertMegParams {
  chatId: string
  msgInfo: MessageAlert[number]
}
