/*
 * @Description: 私聊
 * @Date: 2022-08-05 14:58:52
 * @LastEditTime: 2024-01-11 11:43:40
 */
const {
  getAllUsersFromLocal,
  // getUserInfo: getLocalUserInfo,
  setUserToLocal,
} = require('../utils/socket-common')

/**
 * 安装私聊的 socket 监听
 * @param {Object} socket - socket 对象
 * @param {Object} utils - 工具方法
 */
function bootstrap(socket, utils) {
  const { io, getUserList, updateUserList } = utils

  /**
   * 获取用户名称
   */
  socket.on('get-username', (name) => {
    console.log('获取用户名称', name)
  })

  /**
   * 发送私有消息
   */
  socket.on('send-private-chat', ({ toUser, fromUser, msg }) => {
    console.log(`${fromUser.ip} 对 ${toUser.ip} 说: ${msg}`)

    // 将消息转送到对应 接收者 的客户端
    io.to(toUser.id).emit('send-private-chat', {
      toUser,
      fromUser,
      msg,
      time: Date.now(),
    })

    // 是否自己发送对话给自己 (避免重复发送消息给接收者)
    const isTalkToMyself = fromUser.id === toUser.id
    if (!isTalkToMyself) {
      // 将消息也发送到 发送者 的客户端
      io.to(fromUser.id).emit('send-private-chat', {
        toUser,
        fromUser,
        msg,
        time: Date.now(),
      })
    }
  })

  /**
   * 申请发送文件
   */
  socket.on('private-send-files', ({ toUser, fromUser, msg }) => {
    console.log(`${fromUser.ip} 向 ${toUser.ip} 请求发送文件 `)

    const data = { toUser, fromUser, msg, time: Date.now() }

    io.to(toUser.id).emit('private-send-files', data)
  })

  /**
   * 转发 offer 信息
   */
  socket.on('private-webrtc-offer', ({ toUser, fromUser, data, msg }) => {
    console.log(`${fromUser.ip} 创建了offer , 给到 ${toUser.ip}`)

    const offerState = {
      toUser,
      fromUser,
      data,
      msg,
    }

    io.to(toUser.id).emit('private-webrtc-offer', offerState)
  })

  /**
   * 转发 candidate 信息
   */
  socket.on('private-send-candidate', ({
    toUser,
    fromUser,
    data,
    msg,
  }) => {
    console.log(`${fromUser.ip} 的 candidate , 给到 ${toUser.ip}`)
    const offerState = {
      toUser,
      fromUser,
      data,
      msg,
    }
    io.to(toUser.id).emit('private-send-candidate', offerState)
  })

  /**
   * 获取用户列表 (在线用户)
   */
  socket.on('get-userList', () => {
    io.to(socket.id).emit('get-userList', getUserList())
  })

  /**
   * 获取历史用户信息
   */
  socket.on('get-all-userList', async () => {
    let allUsers = await getAllUsersFromLocal()

    const onlineUsers = getUserList()

    // 包装一层, 看是否在线
    allUsers = allUsers.map((history) => {
      const online = onlineUsers.some(online => online.userId === history.userId)
      history.online = online ? 1 : 0
      return history
    })

    io.to(socket.id).emit('get-all-userList', allUsers)
  })

  /**
   * 获取用户个人信息
   */
  const getUserInfo = () => getUserList().find(({
    id,
  }) => id === socket.id)

  /**
   * 获取用户个人信息
   */
  socket.on('get-userInfo', () => {
    io.to(socket.id).emit('get-userInfo', getUserInfo())
  })

  /**
   * 更新用户个人信息
   * @param {string} key - 用户个人信息字段
   * @param {unknown} value - 值
   */
  socket.on('update-remote-userInfo', async (key, value) => {
    const userInfo = getUserInfo()

    if (key in userInfo) {
      userInfo[key] = value

      await setUserToLocal(userInfo)

      updateUserList()
    }
  })

  // NOTE: 连接成功后, 主动发送一次消息, 延迟是为了让客户端连接 socket 成功后, 能有时间去注册监听事件
  setTimeout(() => {
    io.to(socket.id).emit('get-userInfo', getUserInfo())
  }, 200)
}

exports.dispatchPrivateChat = bootstrap
