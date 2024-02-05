/*
 * @Description: 全局工具类型
 * @Date: 2022-08-08 11:03:09
 * @LastEditTime: 2023-04-23 10:12:12
 */

declare type Nullable<T> = T | null

/**
 * 所处终端
 */
declare type Terminal = 'electron' | 'browser'

/**
 * 用户信息
 */
declare interface UserInfo {
  nickname: Nullable<string> // 昵称
  ip: string // 用户服务的 ip
  id: string // 用户 socket.io 的 id
  port: Nullable<number> // 使用文件服务的端口
  using: boolean // 是否正在使用文件服务
  userId: string // 唯一 id (可能存在本地 storage)
  online?: number
}

/**
 * 历史用户信息
 */
declare type HistoryUserInfo = UserInfo & { online: number }

declare interface Window {
  moonElectronBridge: {
    send(e: string, arg?: unknown): void
    on(e: string, callback: Function): void
    getIpcRenderer(): Electron.IpcRenderer
  }
}

interface BaseViteEnv {
  /**
   * 应用是否运行在开发环境
   */
  readonly DEV: boolean
  /**
   * 应用是否运行在生产环境
   */
  readonly PROD: boolean
  /**
   * 部署应用时的基本 URL。他由base 配置项决定。
   */
  readonly BASE_URL: string
  /**
   * 应用运行的模式
   */
  readonly MODE: string
}

/**
 * 这里配置 vite .env 的环境变量的类型声明
 */
interface ImportMetaEnv extends BaseViteEnv {
  readonly VITE_CHAT_API_ORIGIN: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}