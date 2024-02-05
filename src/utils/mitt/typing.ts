/*
 * @Description:
 * @Date: 2022-08-16 15:20:50
 * @LastEditTime: 2023-03-01 00:50:26
 */

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type MittEvents = {
  /**
   * browser 通知新消息 Mp3 播放
   */
  notifyMessage: void

  'webRTC-set-remotes-done': string
}
