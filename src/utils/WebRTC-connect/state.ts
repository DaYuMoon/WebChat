/*
* @Description: 文件上传信息状态控制
* @Date: 2023-02-11 18:23:43
 * @LastEditTime: 2024-01-11 11:13:25
*/
import type { UnwrapRef } from 'vue'
import { computed, del, reactive, ref, set, toRef, watch } from 'vue'

import { v4 as uuidv4 } from 'uuid'
import { Loading, Message } from 'element-ui'
import { noop } from '@vueuse/core'
import { isArrayBuffer } from 'lodash-es'
import type { LoadingServiceOptions } from 'element-ui/types/loading'
import axios from 'axios'
import { formatFileSize } from '../common'
import type { AcceptingFile, FileTransferInfo, SendingFile } from './typing'
import type { PercentCRef, ProgressRef, SendingFileSizeStatus, SendingTypeRef, SplitFileArrayBufferFn, SplitFileOptions } from './core'
import { RTCLocal, RTCRemote, useSplitFileArrayBuffer } from './core'

import store from '@/store'

import { SOCKET_SERVER_URL, socketRef } from '@/hooks/socket'
import { fileTransferStepWordsEnum, fileTransferTargetEnum } from '@/enum/fileTransferEnum'
import emitter from '@/utils/mitt'
import { chatEvents } from '@/adapter'
import type { SetAlertMegParams } from '@/store/typing'

/**
 * FileTransferUser options 选项
 */
interface FileTransferUserOptions {
  id: UserInfo['id']
  // rtcInstance: NonNullable<RTCConnectInstance>
}

type SplitFileArrayParam = Parameters<SplitFileArrayBufferFn>

/**
  * webRTC 连接实例列表 (这里是包括聊天对象中所有人的)
  * NOTE:
  */
export const fileTransferLists = ref<Record<UserInfo['id'], FileTransferInfo>>({})

// WARM: 已下线的用户, 需要断开连接
const userListRef = toRef(store.state, 'userList')
watch(userListRef, (userList) => {
  Object.entries(fileTransferLists.value).forEach(([id, info]) => {
    const isOffline = userList.every((user) => {
      return user.id !== id
    })

    if (isOffline)
      (info as FileTransferInfo)?.fileTransferIns?.removeUser(id)
  })
}, {
  deep: true,
})

/**
 * 根据 id 设置 fileTransferList 中的成员的属性值
 * @param id - 用户 id
 * @param key - 需要设置的键
 * @param value - 对应的设置的值
 */
function setFileTransferUser<Key extends keyof NonNullable<FileTransferInfo>>(
  id: UserInfo['id'],
  key: keyof NonNullable<FileTransferInfo>,
  value: NonNullable<FileTransferInfo>[Key],
) {
  let fileTransfer = fileTransferLists.value[id]

  if (!fileTransfer) {
    fileTransfer = {
      acceptFiles: [],
      accepting: null,
      fileTransferIns: null,
      rtcIns: null,
      sendFiles: [],
      sending: null,
      userId: id,
    }
    // fileTransfer = new FileTransferUser({ id })
  }

  // 设置属性
  (fileTransfer as FileTransferInfo)[key] = value

  // 登记到 fileTransferList 中
  set(fileTransferLists.value, id, fileTransfer)
}

const chatUserInfo = toRef(store.state, 'currentChatting')
/**
 * 当前聊天对话框用户中的文件发送对象 FileTransferUser
 * NOTE:
 */
export const currentUserTransfer = computed(() => {
  const id = chatUserInfo.value.id
  // console.log('chatUserInfo.value.id : ', id)
  return fileTransferLists.value[id]
})

/**
 * 文件传输信息列表
 */
export class FileTransferUser {
  /**
   * 用户 id
   */
  userId = ''

  /**
   * 发送文件
   */
  private splitFileArrayBuffer: ReturnType<typeof useSplitFileArrayBuffer>['splitFileArrayBuffer']

  /**
   * 文件大小 (reactive)
   */
  sizeReactive: SendingFileSizeStatus = { current: 0, total: 0 }

  /**
   * 上传百分比
   */
  percentCRef: PercentCRef

  /**
   * 当前文件发送状态
   */
  sendingTypeRef: SendingTypeRef

  /**
   * 格式化显示后的上传进度
   */
  progressReactive: UnwrapRef<ProgressRef> = reactive({ current: '', desc: '', total: '' })

  constructor(options: FileTransferUserOptions) {
    // 添加用户
    const { id } = options
    this.userId = id

    // 初始化文件发送的相关工具方法/属性
    const { splitFileArrayBuffer, sizeRef, percentCRef, sendingTypeRef, progressRef } = useSplitFileArrayBuffer()

    this.sizeReactive = sizeRef
    this.splitFileArrayBuffer = splitFileArrayBuffer
    this.percentCRef = percentCRef
    this.sendingTypeRef = sendingTypeRef

    watch(progressRef, (v) => {
      const { current, total, desc } = v
      this.progressReactive.current = current
      this.progressReactive.total = total
      this.progressReactive.desc = desc
    }, { deep: true })

    this.addUser(id)
  }

  /**
   * 发送文件
   * @param file - 文件内容
   */
  async handleSendFile(file: SplitFileArrayParam['0']) {
    // 已有文件发送队列时, 需要等待上一个队列发送完成
    // 当前版本只支持同一用户, 同一队列中只发送一个
    const currentFileTransfer = fileTransferLists.value[this.userId]

    if (currentFileTransfer) {
      if (currentFileTransfer.sending) {
        Message.warning('与当前用户已存在发送文件, 请发送完成后再尝试发送')

        return
      }

      currentFileTransfer.sending = this.createSendingInfo(file)

      set(fileTransferLists.value, this.userId, currentFileTransfer)

      // 将文件信息推入 "发送完成" 的列表中
      const item = fileTransferLists.value[this.userId]

      if (item) {
        const options: SplitFileOptions = {
          start: (target) => {
            item.rtcIns?.dataChannel?.send(target)
          },
          end: (target) => {
            item.rtcIns?.dataChannel?.send(target)
          },
          sendFilename: (target) => {
            item.rtcIns?.dataChannel?.send(target)
          },
          sendFileSize: (target) => {
            item.rtcIns?.dataChannel?.send(target)
          },
          sending: (target) => {
            item.rtcIns?.dataChannel?.send(target)
          },
          uid: currentFileTransfer.sending.id || uuidv4(),
          dataChannel: item.rtcIns?.dataChannel as RTCDataChannel,
        }

        // 切割文件 ArrayBuffer , 并进行发送
        const { result, msg = '' } = await this.splitFileArrayBuffer(file, options)

        console.log('文件发送结果: ', result, msg)

        item.sendFiles.push(currentFileTransfer.sending)

        // 更新值
        currentFileTransfer.sending = null
        set(fileTransferLists.value, this.userId, currentFileTransfer)

        console.log('发送文件完成')
      }
    }
  }

  /**
   * 添加用户
   */
  addUser(id: UserInfo['id']) {
    console.log('绑定', this)
    setFileTransferUser(id, 'fileTransferIns', this)
  }

  /**
   * 移除用户信息 (一般发生在用户离线后, 这里需要清空用户传输的列表信息)
   * @param id - 用户id
   */
  removeUser(id: UserInfo['id']) {
    console.log('用户已下线, 断开 WebRTC 通道连接')

    // 断开 dataChannel  连接
    fileTransferLists.value[id]?.rtcIns?.dataChannel?.close()

    // 断开 WebRTC 连接
    fileTransferLists.value[id]?.rtcIns?.pc?.close()

    // 从 fileTransferLists 中删除
    del(fileTransferLists.value, id)
  }

  /**
   * 通过文件内容, 创建发送的文件详情信息
   * @param file - 文件
   */
  private createSendingInfo(file: File): SendingFile {
    return {
      done: false,
      fileResource: file,
      filename: file.name || '',
      id: uuidv4(),
      size: file.size,
    }
  }
}

export const waitingCreated = reactive<Record<UserInfo['id'], boolean>>({})

/**
 * 安装文件传输相关用到的 socket (主要为接收信息用)
 */
export class InstallSocketToTransferFile {
  /**
   * 解除 watch socket 的方法
   */
  private unwatchSocket: Function = noop
  private unwatchSocketFlag = false

  constructor() {
    this.unwatchSocket = watch(socketRef, (val) => {
      if (val) {
        this.install()
        this.unwatchSocketFlag = true
      }
    },
    { immediate: true },
    )
  }

  /**
   * 安装 socket 事件
   */
  install() {
    if (this.unwatchSocketFlag === true)
      this.unwatchSocket && this.unwatchSocket()

    const socket = socketRef.value
    /**
     * socket 监听文件发送请求
     */
    socket?.on('private-send-files', (info) => {
      const { toUser, fromUser } = info

      // 发送消息
      const emitPrivate = (msgType: WebRTCSendFilesApply['msg']) => {
        socket?.emit('private-send-files', {
          fromUser: toUser,
          toUser: fromUser,
          msg: msgType,
        })
      }

      const msgControls: Partial<Record<WebRTCSendFilesApply['msg'], Function>> = {
        /**
         * 接收端 - 接收发送端的申请
         */
        'apply-fromLocal': () => {
          // 需要做出回应, "同意/拒绝" 发送端的申请
          emitPrivate('agree-fromRemote')
        },
        /**
         * 发送端 - 接收到接收端的消息(允许创建连接)
         */
        'agree-fromRemote': () => {
          console.log('agree-fromRemote')

          const instance = new RTCLocal({
            isLocal: true,
            mineInfo: toUser,
            targetInfo: fromUser,
            onmessage: handleAcceptFile,
          })

          // // NOTE: 如果已经有 dataChannel 建立连接, 则先关闭
          // if (fileTransferLists.value[fromUser.id]?.rtcIns)
          //   fileTransferLists.value[fromUser.id]?.rtcIns?.dataChannel?.close()

          // 设置最新的 rtcInstance 实例
          setFileTransferUser(fromUser.id, 'rtcIns', instance)

          // eslint-disable-next-line no-new
          new FileTransferUser({ id: fromUser.id })

          emitPrivate('created-peerConnect-fromLocal')
        },
        /**
         * 接收端 - 接收到发送端的消息 (发送端已经创建了 pc)
         */
        'created-peerConnect-fromLocal': () => {
          console.log('created-peerConnect-fromLocal')
          const instance = new RTCRemote({
            isLocal: false,
            mineInfo: toUser,
            targetInfo: fromUser,
            onmessage: handleAcceptFile,
          })
          setFileTransferUser(fromUser.id, 'rtcIns', instance)

          // eslint-disable-next-line no-new
          new FileTransferUser({ id: fromUser.id })

          emitPrivate('created-peerConnect-fromRemote')
        },
        /**
         * 发送端 - 接收端已经创建了 pc
         */
        'created-peerConnect-fromRemote': async () => {
          const fileTransfer = fileTransferLists.value[fromUser.id]

          if (fileTransfer) {
            // 这一步开始创建 offer， 并通知接收端接收 offer
            (fileTransfer.rtcIns as RTCLocal).createOffer(fromUser, toUser)
          }
        },
      }

      msgControls[info.msg] && (msgControls[info.msg] as Function)()
    })
  }

  /**
   * 发送文件前的方法
   * 1. 校验是否连接了 webRTC
   *
   * @param toUser - 接收人的信息
   */
  beforeSendFile(toUser: UserInfo, file: File) {
    if (!socketRef.value) { Message.warning('socket.io 尚未初始化完成, 请稍后重试') }
    else {
      const fileTransfer = fileTransferLists.value[toUser.id]

      /**
       * 发送文件
       */
      const send = () => {
        const currentTransfer = fileTransferLists.value[toUser.id]

        if (currentTransfer) {
          // 直接发送文件
          currentTransfer.fileTransferIns?.handleSendFile(file)

          const fileSize = formatFileSize(file.size, 2)

          // 增加一条发送文件的消息 (私聊消息)
          chatEvents?.sendPrivateMessage({
            msg: `文件 [ ${file.name} ] (${fileSize})`,
            fromUser: store.state.userInfo,
            toUser,
          })

          // 发送日志信息
          try {
            const logUrl = `${SOCKET_SERVER_URL}/log/sendFiles`
            axios.post(logUrl, {
              fromId: store.state.userInfo.ip,
              toId: toUser.ip,
              filename: file.name,
              size: fileSize,
            })
          }
          catch (e) {
            console.log(e)
          }
        }
      }

      // dataChannel 通道状态是否正常 (is not 'open' 状态时也要重新连接再传输)
      const isChannelOpen = fileTransfer?.rtcIns?.dataChannel?.readyState === 'open'

      console.log('isChannelOpen: ', isChannelOpen)
      if (isChannelOpen) { send() }
      else {
        // loading 提示
        const loadingOptions: LoadingServiceOptions = {
          text: fileTransfer && !isChannelOpen
            ? fileTransferStepWordsEnum.RECONNECT
            : fileTransferStepWordsEnum.CONNECT,
          target: document.querySelector('div#chat-main') as HTMLElement,
          background: 'rgba(0, 0, 0, 0.2)',
          spinner: 'xxxx',
        }
        /**
         * loading 实例
         */
        const loadingInstance = Loading.service(loadingOptions)

        const overtime = 5000

        const timeoutId = setTimeout(() => {
          // 连接超时后, 需要关闭弹窗提示
          loadingInstance.close()

          Message.error(fileTransferStepWordsEnum.OVERTIME)
        }, overtime)

        set(waitingCreated, toUser.id, false)

        emitter.on('webRTC-set-remotes-done', (id) => {
          console.log('WebRTC连接建立完成... 继续发送文件', id)

          set(waitingCreated, id, true)

          send()

          emitter.off('webRTC-set-remotes-done')

          loadingInstance.close()

          // 清除超时提示的定时器
          clearTimeout(timeoutId)

          Message.success(fileTransferStepWordsEnum.CONNECT_DONE)
        })

        // 申请发送连接
        socketRef.value.emit('private-send-files', {
          fromUser: store.state.userInfo,
          toUser,
          msg: 'apply-fromLocal',
        })

        console.warn('需要连接 webRTC, 正在连接 webRTC 中... ', toUser.id)
      }
    }
  }
}

/**
 * 处理文件 / 消息接收
 * @param data - 文件 ArrayBuffer / 消息 string
 * @param fromId - 消息发送人的 id
 */
function handleAcceptFile(data: ArrayBuffer | string, fromId: UserInfo['id']) {
  // 接收 ArrayBuffer 文件数据(判断如果是 ArrayBuffer 则标识为文件接收)
  const fileTransfer = fileTransferLists.value[fromId] as NonNullable<FileTransferInfo>

  /**
   * 获取 accepting 内容 - 将类型强制设置为 AcceptingFile (为了跳过 ts 类型提示错误)
   */
  const getAcceptingAsMust = () => fileTransfer.accepting as AcceptingFile

  if (typeof data === 'string') {
    console.log('收到消息: ', data)

    // NOTE: 当前收到以 '__' 开头的消息时, 才标识为开始接收消息
    const startWith__ = data.startsWith(fileTransferTargetEnum.STARTS_WITH)
    if (!fileTransfer.accepting && startWith__) {
      fileTransfer.accepting = {
        buffer: [],
        currentSize: 0,
        done: false,
        filename: '',
        id: '',
        size: 0,
        totalSize: 0,
        acceptingDesc: '',
      }
    }

    // 创建接收
    if (data.startsWith(fileTransferTargetEnum.START)) {
      getAcceptingAsMust().id = data.replace(fileTransferTargetEnum.START, '')
      getAcceptingAsMust().buffer = null
      getAcceptingAsMust().done = false
    }
    // 设置文件名字
    else if (data.startsWith(fileTransferTargetEnum.FILE_NAME)) {
      getAcceptingAsMust().filename = data.replace(fileTransferTargetEnum.FILE_NAME, '')
    }
    // 设置文件大小
    else if (data.startsWith(fileTransferTargetEnum.FILE_SIZE)) {
      getAcceptingAsMust().totalSize = Number(data.replace(fileTransferTargetEnum.FILE_SIZE, ''))
      getAcceptingAsMust().currentSize = 0

      // 通知消息
      const sender = store.state.userList.find(user => user.id === fromId) as UserInfo
      const lastMessage = `[文件] ${getAcceptingAsMust().filename || ''}`
      const time = Date.now()
      chatEvents?.alertNewMessage({ [fromId]: { lastMessage, time } }, {
        chatId: sender.userId,
        sender,
        lastMessage,
        time,
      })

      const alertMessageInfo: SetAlertMegParams = {
        chatId: sender.userId,
        msgInfo: { lastMessage, time },
      }
      store.commit('SET_MESSAGE_ALERT', alertMessageInfo)
    }
    // 接收完成
    else if (data.startsWith(fileTransferTargetEnum.END)) {
      getAcceptingAsMust().done = true

      fileTransfer.acceptFiles.push(getAcceptingAsMust())
      fileTransfer.accepting = null

      set(fileTransferLists.value, fromId, fileTransfer)
    }
  }
  else if (isArrayBuffer(data)) {
    // console.log(getAcceptingAsMust(), '----------------')
    if (!getAcceptingAsMust().buffer)
      getAcceptingAsMust().buffer = []

    getAcceptingAsMust().buffer?.push(data)
    getAcceptingAsMust().currentSize += data.byteLength

    // 把接收进度描述 简述一下
    const current = formatFileSize(getAcceptingAsMust().currentSize || 0, 2)
    const total = formatFileSize(getAcceptingAsMust().totalSize || 0, 2)
    getAcceptingAsMust().acceptingDesc = `${current} / ${total}`

    set(fileTransferLists.value, fromId, fileTransfer)
  }
}
