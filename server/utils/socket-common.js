/*
 * @Description: socket.io 事件处理
 * @Date: 2022-08-09 15:02:05
 * @LastEditTime: 2024-01-11 11:04:55
 */
const fs = require('fs')
const path = require('path')
const ReadWriteLock = require('rwlock')

// 创建一个读写锁
const lock = new ReadWriteLock()

/**
 * json 文件地址
 */
const USER_JSON_PATH = path.join(__dirname, '../assets/storage/users.json')

/**
 * 通过 id 查询用户信息
 * @param {string} chatId
 */
async function getUserInfo(chatId) {
  const userList = await getAllUsersFromLocal()
  return userList.find(user => user.id === chatId)
}

/**
 * 从本地文件中获取用户信息
 */
function getAllUsersFromLocal() {
  return new Promise((resolve) => {
    readUsersJsonWithLock((content) => {
      resolve(Object.values(content))
    })
  })
}

/**
 * 记录用户信息到本地 (本次采取 json 文件存储, 暂不开放 sql 使用)
 */
function setUserToLocal(userInfo) {
  return new Promise((resolve) => {
    readUsersJsonWithLock(resolve, true, userInfo)
  })
}

/**
 * 通过读写锁来读取 users.json
 * @param {Function} callback - 读取完成的回调
 * @param {boolean} setJson - 是否需要设置到 users.json 中
 */
function readUsersJsonWithLock(callback, setJson = false, userInfo) {
  lock.readLock((releaseRead) => {
    let content = {}
    fs.readFile(USER_JSON_PATH, (err, data) => {
      if (err) {
        console.log(err)
      }
      else {
        try {
          content = JSON.parse(data.toString())
        }
        catch (e) {
          content = {}
        }
      }

      if (setJson) {
        lock.writeLock((releaseWrite) => {
          const userId = userInfo.userId || ''
          content[userId] = userInfo
          // 文件内容
          const dataJsonString = JSON.stringify(content, null, 2)
          // 写入文件
          fs.writeFile(USER_JSON_PATH, dataJsonString, (err) => {
            if (err)
              console.log(err)

            else
              console.log('更新用户')

            // 执行成功的回调
            callback(content)

            // 释放写锁
            releaseWrite()
          })
        })

        // 释放读锁
        releaseRead()
      }
      else {
        // 执行成功的回调
        callback(content)

        // 释放读锁
        releaseRead()
      }
    })
  })
}

exports.getAllUsersFromLocal = getAllUsersFromLocal
exports.setUserToLocal = setUserToLocal
exports.getUserInfo = getUserInfo
