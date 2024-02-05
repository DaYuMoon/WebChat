/*
* @Description:
* @Date: 2022-08-06 01:26:21
 * @LastEditTime: 2023-07-07 09:26:23
*/
import type { Ref } from 'vue'
import type { Socket } from 'socket.io-client'
import { ref } from 'vue'
import { Message } from 'element-ui'
import { io } from 'socket.io-client'
import { chatEvents } from '@/adapter'
import { socketDisconnectTips } from '@/enum/tipsEnum'
import { getUserId } from '@/utils/common'

export type SocketInstance = Socket<ServerToClientEvents, ClientToServerEvents>

const isDev = import.meta.env.DEV

/**
 * socket 地址
 */
const SOCKET_SERVER_URL = import.meta.env.VITE_CHAT_API_ORIGIN

/**
 * socket 实例
 */
let socket: null | SocketInstance = null

const socketRef: Ref<Nullable<SocketInstance>> = ref(null)

/**
 * 外部获取 socket 实例
 */
const getSocketClientInstance = (): SocketInstance | null => socket

let connectTimes = 0
/**
 * 连接 socket
 */
function connect(nickname = ''): Promise<boolean> {
  if (!SOCKET_SERVER_URL && isDev) {
    console.log('请先设置环境变量 .env 文件的 %cVITE_CHAT_API_ORIGIN', 'font-weight: bold')
    throw new Error('请先设置环境变量 .env 文件的 VITE_CHAT_API_ORIGIN')
  }

  const connectServer = () => {
    socket = io(SOCKET_SERVER_URL, {
      query: {
        userId: getUserId(),
        nickname,
      },
      reconnection: true, // 是否开启重新连接，默认为 true
      reconnectionAttempts: Infinity, // 重新连接尝试的次数
      reconnectionDelay: 500, // 重新连接之前的延时时间(单位: 毫秒), 默认为 1000  设置初始重新连接延迟为1秒钟
      reconnectionDelayMax: 2000, // 最大重新连接延迟为5秒钟
    })

    socketRef.value = socket
  }

  if (!socket)
    connectServer()

  const msgInsList: Array<ReturnType<typeof Message>> = []

  socket?.on('disconnect', (reason) => {
    console.log('断线了 - 原因: ', reason)

    msgInsList.push(Message({
      type: 'warning',
      message: socketDisconnectTips[reason],
      duration: 0,
    }))
  })

  socket?.on('connect_error', (err) => {
    msgInsList.push(Message({
      type: 'error',
      message: `连接异常: ${err.message}`,
      duration: 1500,
    }))
  })

  return new Promise((resolve) => {
    socket?.on('connect', () => {
      connectTimes++

      if (connectTimes > 1) {
        console.log(connectTimes)
        handleReconnectSocket()

        // 清除所有 Message 提示
        msgInsList.forEach((ins) => {
          ins.close()
        })

        Message.success('重连成功!')
      }

      console.log('socket.io已连接')
      resolve(true)
    })
  })
}

/**
 * 断开连接
 */
function disconnect() {
  if (socket) {
    socket.disconnect()

    Message({
      type: 'warning',
      message: '已断开连接',
      duration: 0,
    })
  }
  else { console.log('未曾连接socket.io') }
}

/**
 * socket 重连后的操作
 */
function handleReconnectSocket() {
  chatEvents?.handleReconnect()
}

function useGetSocketIns() {
  const r = socketRef as Ref<null | SocketInstance>

  return { socketRef: r }
}

export {
  socketRef,
  SOCKET_SERVER_URL,
  connect,
  disconnect,
  getSocketClientInstance,
  useGetSocketIns,
}
