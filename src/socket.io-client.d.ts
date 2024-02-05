
/*
 * @Description: 
 * @Date: 2022-08-06 01:36:22
 * @LastEditTime: 2024-01-08 17:58:05
 */

/**
 * socket 服务端  .on
 */
declare interface ServerToClientEvents {
  // noArg: () => void;
  // basicEmit: (a: number, b: string, c: Buffer) => void;
  // withAck: (d: string, callback: (e: number) => void) => void;
  'send-private-chat': (msgInfo: SendPrivateChat) => void
  'get-userList': (userList: UserInfo[]) => void;
  'get-all-userList': (userInfo: HistoryUserInfo[]) => void
  'get-userInfo': (userInfo: Nullable<UserInfo>) => void
  'private-send-files': (msgInfo: WebRTCSendFilesApply) => void
  'private-webrtc-offer': (info: WebRTCOfferInfo) => void
  'private-send-candidate': (info: WebRTCCandidateInfo) => void
}

/**
 * 客户端 socket.io 事件名称  .emit
 */
declare interface ClientToServerEvents {
  'send-private-chat': (msgInfo: SendPrivateChat) => void
  'get-userList': () => void
  'get-all-userList': () => void
  'get-userInfo': () => void
  'update-remote-userInfo': (key: keyof UserInfo, value: UserInfo[keyof UserInfo]) => void
  'private-send-files': (msgInfo: WebRTCSendFilesApply) => void
  'private-webrtc-offer': (info: WebRTCOfferInfo) => void
  'private-send-candidate': (info: WebRTCCandidateInfo) => void

}

declare interface InterServerEvents {
  ping: () => void;
}

declare interface SocketData {
  name: string;
  age: number;
}

/**
 * 发送私聊消息入参
 */
declare interface SendPrivateChat {
  // 消息接收人
  toUser: UserInfo,
  // 消息发送人
  fromUser: UserInfo,
  // 发送的消息内容
  msg: string,
  // 发送时间 Date.now()
  time?: number
}

type PickPrivateInfo = Pick<SendPrivateChat, 'toUser' | 'fromUser'>

type TargetFromLocal = 'fromLocal' 
type TargetFromRemote = 'fromRemote'

type ConnectApply = `apply-${TargetFromLocal}` | `reject-${TargetFromRemote}` | `agree-${TargetFromRemote}`

type ConnectCreate = `created-peerConnect-${TargetFromLocal}` | `created-peerConnect-${TargetFromRemote}` 

type ConnectInit = `init-done-${TargetFromLocal}` | `init-done-${TargetFromRemote}`

/**
 * 申请发送文件
 */
declare interface WebRTCSendFilesApply extends PickPrivateInfo {
  msg:  ConnectApply | ConnectCreate | ConnectInit
}

/**
 * 发送 offer
 */
declare interface WebRTCOfferInfo extends PickPrivateInfo {
  data: RTCSessionDescriptionInit
  msg: `send-offer-${TargetFromLocal}` | `answer-${TargetFromRemote}`
}

/**
 * 发送候选人 candidate
 */
declare interface WebRTCCandidateInfo extends PickPrivateInfo {
  data: RTCPeerConnectionIceEvent['candidate']
  msg: `send-candidate-${TargetFromLocal}` | `send-candidate-${TargetFromRemote}` 
}