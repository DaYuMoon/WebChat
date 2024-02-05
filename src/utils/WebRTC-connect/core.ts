/*
 * @Description:
 * @Date: 2023-02-11 18:23:36
 * @LastEditTime: 2023-03-01 15:35:09
 *
 * TODO: 需要优化 dataChannel 传输时, 数据直接使用  __target__ 这种方式去匹配, 后续改成对象方式
 */

// import { v4 as uuidv4 } from 'uuid'
import type { ComputedRef, Ref } from 'vue'
import { computed, reactive, ref, watch } from 'vue'
import Big from 'big.js'
import { promiseTimeout } from '@vueuse/core'
import { formatFileSize } from '../common'
import type { DataChannelCallback, InitFnCallback } from './typing'
import { type Options, RTCConnect } from './typing'
import { getSocketClientInstance } from '@/hooks/socket'
import { fileTransferTargetEnum } from '@/enum/fileTransferEnum'
import emitter from '@/utils/mitt'

const CHANNEL_TARGET = 'webrtc-datachannel'
/**
 * dataChannel 最大阈值
 */
const BUFFER_THRESHOLD = 65536

/**
 * dataChannel 每次传输时, ArrayBuffer 的切片大小(片段大小 fragment)
 */
const BUFFER_SET_CHUNK_SIZE = 16384 * 2

/**
 * 发送端
 */
class RTCLocal extends RTCConnect {
  constructor(options: Options) {
    super(options)

    this.socket = getSocketClientInstance()

    const cb = {
      onmessage: options.onmessage,
    }
    this.init(cb)
  }

  init(options: InitFnCallback): void {
    this.pc = new RTCPeerConnection()

    this.initDataChannel(options)
    this.watchIceCandidate()

    this.socket?.on('private-webrtc-offer', async (info) => {
      if (info.msg === 'answer-fromRemote') {
        // 发送者接受接收者的 answer
        await this.pc?.setRemoteDescription(info.data)

        // TODO: 这里直接使用 timeout , 然后直接通信 ()
        await promiseTimeout(2000)

        console.warn('local - setRemoteDes')

        emitter.emit('webRTC-set-remotes-done', info.fromUser.id)
      }
    })

    this.socket?.on('private-send-candidate', (info) => {
      if (info.data && info.msg === 'send-candidate-fromRemote')
        this.pc?.addIceCandidate(info.data)
    })
  }

  initDataChannel(options: DataChannelCallback): void {
    this.dataChannel = (this.pc as RTCPeerConnection).createDataChannel(CHANNEL_TARGET)
    // 设置为 arraybuffer 方便大文件切片处理
    this.dataChannel.binaryType = 'arraybuffer'

    // 设置阈值
    this.dataChannel.bufferedAmountLowThreshold = BUFFER_THRESHOLD

    console.log('initDataChannel')
    this.dataChannel.onopen = (e) => {
      this.dataChannel?.send('hi~!')
      console.log('dataChannel - open', e)
    }
    this.dataChannel.onmessage = (e) => {
      // console.log('dataChannel - onmessage', e)

      options?.onmessage && options.onmessage(e.data, this.targetInfo?.id || '')
    }
    this.dataChannel.onclose = (e) => {
      console.log('dataChannel - onclose', e)
    }
  }

  watchIceCandidate(): void {
    (this.pc as RTCPeerConnection).onicecandidate = (e) => {
      if (e.candidate) {
        console.warn('send-candidate-fromLocal', e)
        this.socket?.emit('private-send-candidate', {
          fromUser: this.mineInfo as UserInfo,
          toUser: this.targetInfo as UserInfo,
          data: e.candidate,
          msg: 'send-candidate-fromLocal',
        })
      }
    }
  }

  /**
   * 创建 offer 给到接收端, 两端设置 offer desc描述
   * @param toUser - 接收人
   * @param fromUser - 发送人
   */
  async createOffer(toUser: WebRTCOfferInfo['toUser'], fromUser: WebRTCOfferInfo['fromUser']) {
    if (this.pc) {
      const offer = await this.pc.createOffer()

      this.pc.setLocalDescription(offer)
      this.socket?.emit('private-webrtc-offer', {
        toUser,
        fromUser,
        data: offer,
        msg: 'send-offer-fromLocal',
      })

      console.warn('local - setLocalDes')
    }
  }
}

/**
 * 接收端
 */
class RTCRemote extends RTCConnect {
  constructor(options: Options) {
    super(options)

    this.socket = getSocketClientInstance()

    const cb = {
      onmessage: options.onmessage,
    }
    this.init(cb)
  }

  init(options: InitFnCallback): void {
    this.pc = new RTCPeerConnection()

    this.initDataChannel(options)
    this.watchIceCandidate()

    this.socket?.on('private-webrtc-offer', (info) => {
      if (info.msg === 'send-offer-fromLocal') {
        // 接收者接受发送者的 offer
        this.answerOffer(info)
      }
    })

    this.socket?.on('private-send-candidate', (info) => {
      if (info.data && info.msg === 'send-candidate-fromLocal')
        this.pc?.addIceCandidate(info.data)
    })
  }

  initDataChannel(options: DataChannelCallback): void {
    (this.pc as RTCPeerConnection).ondatachannel = (e) => {
      this.dataChannel = e.channel

      // 设置阈值
      this.dataChannel.bufferedAmountLowThreshold = BUFFER_THRESHOLD

      this.dataChannel.onopen = (e) => {
        console.log('dataChannel - open ', e)
        this.dataChannel?.send('hi back~!')
      }
      this.dataChannel.onmessage = (e) => {
        // console.log('dataChannel - onmessage', e)

        options?.onmessage && options.onmessage(e.data, this.targetInfo?.id || '')
      }
      this.dataChannel.onclose = (e) => {
        console.log('dataChannel - onclose', e)
      }
    }
  }

  watchIceCandidate(): void {
    (this.pc as RTCPeerConnection).onicecandidate = (e) => {
      console.log('remote - onicecandidate', e)
      if (e.candidate === null)
        return

      this.socket?.emit('private-send-candidate', {
        fromUser: this.mineInfo as UserInfo,
        toUser: this.targetInfo as UserInfo,
        data: e.candidate,
        msg: 'send-candidate-fromRemote',
      })
    }
  }

  /**
   * 接收发送端传来的 offer , 设置并生成新的 answer 响应到发送端
   * @param info - offer 消息信息
   * @returns answer
   */
  private async answerOffer(info: WebRTCOfferInfo) {
    if (this.pc) {
      await this.pc.setRemoteDescription(info.data)

      console.log('remote - setRemoteDes')
      const answer = await this.pc.createAnswer()

      await this.pc.setLocalDescription(answer)

      const answerInfo: WebRTCOfferInfo = {
        data: answer,
        fromUser: info.toUser,
        toUser: info.fromUser,
        msg: 'answer-fromRemote',
      }
      this.socket?.emit('private-webrtc-offer', answerInfo)
    }
  }
}

interface SplitFileOptions {
  start: (target: string) => void
  sendFilename: (target: string) => void
  sendFileSize: (target: string) => void
  sending: (fragment: ArrayBuffer) => void
  end: (target: string) => void
  uid: string
  dataChannel: RTCDataChannel
}
interface SplitFileArrayBufferFn {
  (file: File, options: SplitFileOptions): Promise<{ result: boolean; msg?: string }>
}
/**
 * 文件发送状态
 */
type SendingType = 'ready' | 'sending' | 'done'

/**
 * 文件名发送时, 大小状态
 */
interface SendingFileSizeStatus { total: number; current: number }

/**
 * 文件 上传/下载 百分比
 */
type PercentCRef = ComputedRef<string>

/**
 * 当前文件发送状态
 */
type SendingTypeRef = Ref<SendingType>

/**
 * 文件上传状态简述 - 一般用于显示百分比进度
 */
type ProgressRef = Ref<{
  total: string
  current: string
  desc: string
}>

/**
 * 切割文件 ArrayBuffer 并通过 dataChannel 发送
 */
function useSplitFileArrayBuffer() {
  const size = reactive<SendingFileSizeStatus>({
    total: 0,
    current: 0,
  })

  /**
   * 上传的百分比
   */
  const percentCRef: PercentCRef = computed<string>(() => {
    if (size.total === 0) { return '0' }
    else {
      if (size.current >= size.total) { return '100' }
      else {
        // 利用 big.js 解决 number 精度丢失的问题 (导致后面很多99999)
        const big = new Big(size.current / size.total)
        const fixedFloat = big.toFixed(2)
        const end = new Big(fixedFloat).toNumber() * 100
        return new Big(end).toFixed(0)
      }
    }
  })

  /**
   * 当前文件的发送状态
   */
  const sendingTypeRef: SendingTypeRef = ref<SendingType>('ready')

  /**
   * 文件上传状态
   */
  const progressRef: ProgressRef = ref({
    total: '',
    current: '',
    desc: '',
  })

  watch([() => progressRef.value.current, () => progressRef.value.total], ([c, t]) => {
    const current = c || formatFileSize(0, 2)
    const total = t || formatFileSize(0, 2)
    progressRef.value.desc = `${current} / ${total}`
  }, {
    immediate: true,
  })

  /**
   * 切割文件 ArrayBuffer , 使其支持 dataChannel 发送消息时, 发送大小限制
   */
  const splitFileArrayBuffer: SplitFileArrayBufferFn = (file, options) => {
    size.total = file.size

    progressRef.value.total = formatFileSize(file.size, 2)

    let offset = 0
    const fileReader = new FileReader()
    const id = options.uid

    sendingTypeRef.value = 'ready'

    const { start, sendFilename, sending, end, sendFileSize, dataChannel } = options

    function readSlice(index: number) {
      const slice = file.slice(offset, index + BUFFER_SET_CHUNK_SIZE)
      fileReader.readAsArrayBuffer(slice)
    }
    readSlice(0)

    return new Promise((resolve) => {
      fileReader.addEventListener('load', (evt) => {
        if (sendingTypeRef.value === 'ready') {
          start(`${fileTransferTargetEnum.START}${id}`)
          sendingTypeRef.value = 'sending'
          sendFilename(`${fileTransferTargetEnum.FILE_NAME}${file.name}`)
          sendFileSize(`${fileTransferTargetEnum.FILE_SIZE}${file.size}`)
        }

        if (sendingTypeRef.value === 'sending') {
          const continueReadData = () => {
            const resultArrayBuffer = evt.target?.result as ArrayBuffer
            offset += resultArrayBuffer.byteLength

            size.current = offset
            progressRef.value.current = formatFileSize(offset, 2, ['B', 'K', 'M', 'G'])

            if (offset < file.size)
              readSlice(offset)

            else
              sendingTypeRef.value = 'done'
          }

          sending(evt.target?.result as ArrayBuffer)

          const { bufferedAmount, bufferedAmountLowThreshold } = dataChannel

          // 目前队列超过最大阈值, 需要让已存在的发送队列先发送完, 否则会引起 queue full 的错误
          if (bufferedAmount > bufferedAmountLowThreshold) {
            dataChannel.onbufferedamountlow = () => {
              // 发送队列低于队列阈值了, 可以继续发送
              dataChannel.onbufferedamountlow = null
              // 继续切片读取发送
              continueReadData()
            }
          }
          else {
            continueReadData()
          }
        }

        if (sendingTypeRef.value === 'done') {
          console.log('send-done')
          end(`${fileTransferTargetEnum.END}${id}`)
          resolve({ result: true })
        }
      })
    })
  }

  return {
    /**
     * 分段发送文件 ArrayBuffer (Function)
     */
    splitFileArrayBuffer,
    /**
     * 文件大小
     */
    sizeRef: size,
    /**
     * 上传百分比
     */
    percentCRef,
    /**
     * 上传状态
     */
    sendingTypeRef,
    /**
     * 格式化显示后的上传进度
     */
    progressRef,
  }
}

export {
  RTCLocal,
  RTCRemote,
  useSplitFileArrayBuffer,
  type SplitFileArrayBufferFn,
  type SplitFileOptions,
  type SendingFileSizeStatus,
  type PercentCRef,
  type SendingTypeRef,
  type ProgressRef,
}

