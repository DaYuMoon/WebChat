/*
 * @Description:全局提示信息
 * @Date: 2023-04-20 23:12:33
 * @LastEditTime: 2023-04-20 23:30:00
 */

import { type Socket } from 'socket.io-client'

/**
 * socket.io-client 中, 连接错误的提示
 */
export const socketDisconnectTips: Record<Socket.DisconnectReason, string> = {
  'io client disconnect': '服务端强制断开socket.io连接',
  'io server disconnect': '已主动(手动)断开socket.io连接',
  'ping timeout': 'ping超时,服务未在ping范围内',
  'transport close': '连接已断开,原因: "用户丢失了连接, 网络错误, 服务重启..."',
  'transport error': '未知连接/网络错误',
}

