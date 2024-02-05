/*
 * @Description: socket 服务端设置
 * @Date: 2022-08-05 14:50:46
 * @LastEditTime: 2024-01-11 14:27:50
 */
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
const server = http.createServer(app)

const io = require('socket.io')(server, { cors: true })

const { getUserIp } = require('./utils/common')
const { dispatchPrivateChat } = require('./options/private-chat')
const { setUserToLocal } = require('./utils/socket-common')

const port = 20102

/**
 * 用户列表 (在线用户)
 */
const userList = []

const utils = {
  /**
   * 获取用户列表
   */
  getUserList,
  /**
   * socket实例
   */
  io,
  /**
   * 推送用户列表信息 (主动通知客户端)
   */
  updateUserList() {
    io.emit('get-userList', getUserList())
  },
}

io.on('connection', (socket) => {
  console.log('connect success: ', socket.id, socket.handshake.query.userId)

  // 用户断开连接
  socket.on('disconnect', () => {
    const userIndex = userList.findIndex(({ id }) => id === socket.id)

    // 更新用户列表
    userList.splice(userIndex, 1)

    // 断开连接后, 主动通知客户端, 推送新的用户列表信息
    utils.updateUserList()
  })

  pushUser(socket)

  /* 分发私聊相关的功能 */
  dispatchPrivateChat(socket, utils)
})

/**
 * 统计用户信息
 * @param {*} socket
 */
async function pushUser(socket) {
  // 该字段用户预留 (静态文件托管服务是否开启)
  // NOTE: 目前该字段没有使用
  const using = false

  // 文件托管端口 (预留, 目前没使用到)
  const staticFileHostingPort = null

  const { address, query } = socket.handshake

  const userInfo = {
    ip: getUserIp(address), // 用户 ip
    id: socket.id, // 这个是 socket.io 提供的客户端的连接 id
    userId: query.userId, // 这个是客户端自己生成的用户 id (保存在客户端 localStorage)
    using,
    port: staticFileHostingPort,
    nickname: query.nickname || null, // 用户昵称
  }

  // 设置用户信息到 users.json 文件中
  await setUserToLocal(userInfo)

  // 登记用户信息
  userList.push(userInfo)

  // 通知所有用户, 更新用户列表
  utils.updateUserList()
}

/**
 * 获取用户列表
 */
function getUserList() {
  return userList
}

// 允许跨域
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With')
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('X-Powered-By', ' 3.2.1')

  if (req.method === 'OPTIONS')
    res.sendStatus(200)/* 让options请求快速返回 */
  else next()
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(require('./routes/log').router)

server.listen(port, () => void console.log(`socket server running on port ${port}`))
