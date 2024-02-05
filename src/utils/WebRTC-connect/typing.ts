/*
 * @Description:
 * @Date: 2023-02-11 18:23:43
 * @LastEditTime: 2023-03-01 19:08:35
 */

import type { RTCLocal, RTCRemote } from './core'
import type { FileTransferUser } from './state'
import type { getSocketClientInstance } from '@/hooks/socket'

export interface Options extends InitFnCallback {
  /**
   * 对方用户信息
   */
  targetInfo: SendPrivateChat['toUser']
  /**
   * 本机用户信息
   */
  mineInfo: SendPrivateChat['fromUser']
  /**
   * 是否为本地连接
   */
  isLocal: boolean

}

export interface InitFnCallback {
  onmessage?: (e: ArrayBuffer | string, fromId: UserInfo['id']) => void
}
export type DataChannelCallback = InitFnCallback

/**
 * RTCPeerConnect 连接抽象类
 */
export abstract class RTCConnect {
  /**
   * peerConnection 实例
   */
  pc: Nullable<RTCPeerConnection> = null

  /**
   * 消息通道实例
   */
  dataChannel: Nullable<RTCDataChannel> = null

  /**
   * 是否为本地发起端
   */
  isLocal = false

  /**
   * 本机用户信息
   */
  mineInfo: Nullable<Options['mineInfo']> = null

  /**
   * 对方端的用户信息
   */
  targetInfo: Nullable<Options['targetInfo']> = null

  /**
   * socket 实例
   */
  socket: ReturnType<typeof getSocketClientInstance> = null

  constructor(options: Options) {
    this.isLocal = options.isLocal
    this.mineInfo = options.mineInfo
    this.targetInfo = options.targetInfo
  }

  /**
   * 初始化
   */
  abstract init(options: InitFnCallback): void

  /**
   * 初始化消息通道
   */
  abstract initDataChannel(options: DataChannelCallback): void

  /**
   * 增加候选人监听回调
   */
  abstract watchIceCandidate(): void
}

/**
 * webRTC 连接实例
 */
export type RTCConnectInstance = Nullable<RTCLocal | RTCRemote>

/**
 * RTC 连接实例
 */
export type FileTransferInfo = Nullable<{
  /**
   * 对方用户 id
   */
  userId: UserInfo['id']

  /**
   * 所有接收的文件 (list)
   */
  acceptFiles: AcceptingFile[]

  /**
   * 正在接收的文件 (接收成功后, 会推入 acceptFiles 中)
   */
  accepting: Nullable<AcceptingFile>

  /**
   * 所有发送的文件 (list)
   */
  sendFiles: SendingFilesItem[]

  /**
   * 正在发送的文件 (发送成功后, 会推入 sendFiles 中)
   */
  sending: Nullable<SendingFile>

  /**
   * webRTC 连接实例
   */
  rtcIns: Nullable<RTCConnectInstance>

  /**
   * 文件发送对象 实例
   */
  fileTransferIns: Nullable<FileTransferUser>
}>

/**
 * 基础文件信息
 */
export interface BasicFileInfo {
  /**
   * 是否接收/发送完成
   */
  done: boolean
  /**
   * 文件随机 id
   */
  id: string
  /**
   * 文件名
   */
  filename: string
  /**
   * 文件大小
   */
  size: number
}

/**
 * 接收完成的文件信息
 */
export interface AcceptFilesItem extends BasicFileInfo {
  /**
   * 当前的文件的 ArrayBuffer
   */
  buffer: Nullable<ArrayBuffer[]>
}

/**
 * 发送完成的文件信息
 * @description 发送者-发送完成的文件, 不保存 buffer , 节省内存
 */
export interface SendingFilesItem extends BasicFileInfo {}

/**
 * 正在接收的文件信息
 */
export interface AcceptingFile extends BasicFileInfo {
  /**
   * 当前的文件的 ArrayBuffer
   */
  buffer: Nullable<ArrayBuffer[]>
  /**
   * 接收的文件的总大小
   */
  totalSize: number
  /**
   * 当前接收的大小 (一般正在接收中的时候, 这个大小就会改变)
   */
  currentSize: number
  /**
   * 当前接收进度简写
   */
  acceptingDesc: string
}

/**
 * 正在发送的文件信息
 */
export interface SendingFile extends BasicFileInfo {
  /**
   * 文件资源 (发送端的文件源, 一般通过拖拽, 获取 File 文件对象)
   */
  fileResource: Nullable<File>
}
