/*
 * @Description:
 * @Date: 2022-08-16 15:20:44
 * @LastEditTime: 2022-08-16 15:23:13
 */

import mitt from 'mitt'
import type { MittEvents } from './typing'

const emitter = mitt<MittEvents>()

export default emitter
