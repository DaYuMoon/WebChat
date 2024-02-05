/**
 * 截取用户信息 获取 ip
 * @param {*} address
 */
function getUserIp(address) {
  return address.replace(/::ffff:/, '')
}

exports.getUserIp = getUserIp
