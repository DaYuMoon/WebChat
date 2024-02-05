/*
 * @Description:
 * @Date: 2022-08-08 10:37:47
 * @LastEditTime: 2024-01-11 11:25:24
 */
import type { Ref } from 'vue'
import { ref } from 'vue'
import type { CurrentChatMsg, MessageAlert, PrivateChatLogsHistory } from '@/store/typing'

/**
 * 聊天事件抽象类
 * 可能使用于 electron 或 普通 web 中
 *
 * NOTE: 核心通信事件需要抽离为每个端适配
 */
export abstract class ChatEvents {
  /**
   * 应用所处终端
   */
  public terminal: Terminal
  /**
   * 用户列表
   */
  public userList: Ref<UserInfo[]> = ref([])
  /**
   * 我的用户信息
   */
  public mineUserInfo: Ref<Nullable<UserInfo>> = ref(null)
  /**
   * 聊天信息
   */
  public privateMessage: Ref<string> = ref('')

  constructor(terminal: Terminal) {
    this.terminal = terminal
  }

  /**
   * 断线重连后, 触发的这个方法
   */
  public abstract handleReconnect(): void

  /**
   * 连接 socket 客户端
   * NOTE: electron 端可能使用其他实现方法
   */
  protected abstract connect(userInfo?: Partial<UserInfo>): void

  /**
   * 获取用户信息
   * @note (事件通信) emitter
   */
  abstract getUserInfo(): void

  /**
   * 获取用户列表 (在线用户)
   * @note (事件通信) emitter
   */
  abstract getUserList(): void

  /**
   * 获取所有用户 (在线用户和已下线的用户)
   * @note (事件通信) emitter
   */
  abstract getAllUserList(): void

  /**
   * 接收消息
   * @note (事件通信) emitter
   */
  abstract acceptMessage(): void

  /**
   * 发送私有消息
   * @note (事件通信) emitter
   *
   * @param toId - 接收者 id
   * @param fromId - 发送者 id
   * @param msg - 发送的消息
   */
  abstract sendPrivateMessage(msgInfo: SendPrivateChat): void

  /**
   * 将聊天记录设置到 storage 中
   * NOTE: 历史聊天记录的存储入口
   */
  abstract setLogsToStorage(): void

  /**
   * 从 storage 中获取所有历史聊天记录
   * NOTE: 历史聊天记录的获取入口
   */
  abstract getLogsFromStorage(): PrivateChatLogsHistory

  /**
   * 提示新消息到达
   * @param total - 所有新消息
   * @param current - 当前接收到的新消息
   */
  abstract alertNewMessage(total: MessageAlert, current: CurrentChatMsg): void
}

