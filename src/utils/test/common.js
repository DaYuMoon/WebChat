/*
 * @Description:
 * @Date: 2022-09-26 11:52:30
 * @LastEditTime: 2022-09-26 11:52:31
 */

/**
 * 判断数据是否为 object 类型
 * @param {*} data
 */
export function isObject(data) {
  return Object.prototype.toString.call(data) === '[object Object]'
}
