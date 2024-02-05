/*
 * @Description: 文件传输信息
 * @Date: 2023-02-25 14:37:09
 * @LastEditTime: 2024-01-11 11:09:53
 */

/**
 * 文件传输标记
 */
export enum fileTransferTargetEnum {
  STARTS_WITH = '__',
  START = '__start__',
  END = '__end__',
  FILE_NAME = '__filename__',
  FILE_SIZE = '__fileSize__',
}

export enum fileTransferStepWordsEnum {
  RECONNECT = '重新连接 WebRTC 文件传输通道...',
  CONNECT = '🤝 正在建立 WebRTC 文件传输通道 ...',
  CONNECT_DONE = 'WebRTC 通道建立完成, 开始传输文件 ...',
  OVERTIME = '文件通道连接超时',
}

export enum fileTransTipsEnum {
  REMINDER = '已支持直接发送文件, 拖动文件至聊天框 / 文字输入框内, 即可发送文件至对方...',
  SHORT_REMINDER = '(💥)',
}
