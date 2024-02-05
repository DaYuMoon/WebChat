const STORAGE_KEY_NICKNAME = 'chat-nickname'

/**
 * 设置本地用户昵称
 * @param nickname 昵称
 */
export const setNickname = (nickname: string) => {
  localStorage.setItem(STORAGE_KEY_NICKNAME, nickname)
}
/**
 * 获取本地用户昵称
 */
export const getNickname = () => localStorage.getItem(STORAGE_KEY_NICKNAME) ?? ''
