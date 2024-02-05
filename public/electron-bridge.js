/*
 * @Description: electron 通信桥接
 * @Date: 2022-08-12 12:05:12
 * @LastEditTime: 2023-02-25 12:43:02
 */

/**
 * WARM: 注意: 这里的方法只是用来桥接到 electron, 具体的通信方法还得在 electron 主进程 文件中再写一遍
 * 
 * 这个文件存在的目的是, 不让 vite 打包进去, 用于使用一些 electron 的方法(前提是应用必须运行在 electron 的环境中, NOTE: 注意 BrowserWindow 的 nodeIntegration 需为 true )
 */

/**
 * 判断是否在 electron 环境
 * @returns {boolean}
 */
function isElectron() {
    // Renderer process
    if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
        return true;
    }

    // Main process
    if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
        return true;
    }

    // Detect the user agent when the `nodeIntegration` option is set to false
    if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
        return true;
    }

    return false;
}

const toast = () => {
  if (!isElectron) {
    console.log('不在 electron ')
    return false
  } return true
}

function bootstrap() {
  /**
   * 如果不是在 electron 环境下则不执行
   */
  if (!isElectron()) return void 0

  const { ipcRenderer } = require('electron')
  // ipcRenderer.on('', () => {})  ipcRenderer.send('', arg)

  const moonElectronBridge = {
    /**
     * 发送
     */
    send() {
      console.log(arguments)
      const [event, ...arg] = arguments
      ipcRenderer.send(event, ...arg)
    },

    /**
     * 接收
     */
    on() {
      const [event, callback] = arguments 
      ipcRenderer.on(event, callback)
    },

    getIpcRenderer: () => ipcRenderer,

  }

  /**
   * 将桥接入口方法暴露在 window 对象中
   */
  window.moonElectronBridge = moonElectronBridge
}

bootstrap()