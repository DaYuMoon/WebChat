/*
 * @Description:
 * @Date: 2022-08-08 00:15:15
 * @LastEditTime: 2023-05-06 15:47:55
 */
import { v4 as uuidv4 } from 'uuid'
import type { NotUndefined } from 'vue'
import vue from 'vue'
export const STORAGE_USER_ID_KEY = 'chat_socket_userId'

/**
 * 转化纯文字到 html 中显示换行
 * @param text - 原始文字
 */
export function wrapPureText(text: string): string {
  return text.replace(/\n/g, '<br>')
}

/**
 * 获取 userId (需要做适配)
 */
export function getUserId(): string {
  let id = localStorage.getItem(STORAGE_USER_ID_KEY)
  if (!id) {
    id = uuidv4()
    localStorage.setItem(STORAGE_USER_ID_KEY, id)
  }
  return id
}

type FormatFileUnit = 'B' | 'K' | 'M' | 'G' | 'TB'
/**
 * 格式化文件大小显示
 * @param size - 文件大小
 * @param pointLength - 精确到的小数点数
 * @param units - 单位数组。从字节，到千字节，一直往上指定。
 *    如果单位数组里面只指定了到了K(千字节)，同时文件大小大于M, 此方法的输出将还是显示成多少K.
 */
export function formatFileSize(size: number, pointLength: number, units?: FormatFileUnit[]): string {
  let unit
  units = units || ['B', 'K', 'M', 'G', 'TB']
  // eslint-disable-next-line no-cond-assign
  while ((unit = units.shift()) && size > 1024)
    size = size / 1024

  return (unit === 'B' ? size : size.toFixed(pointLength === undefined ? 2 : pointLength)) + (unit as NotUndefined<typeof unit>)
}

/**
 * 依据单文件组件返回的内容, 创建 vue instance 实例 (Vue 组件构造器)
 * @param cons - vue 单文件组件组件内容
 * @returns 返回一个在内存中的一个新的组件实例
 */
export function createVueCons(cons: any) {
  const CopyIconComp = vue.extend(cons)
  const CopyIconCompIns = new CopyIconComp()
  CopyIconCompIns.$mount()
  return CopyIconCompIns
}
