/*
 * @Description:
 * @Date: 2022-08-16 16:12:00
 * @LastEditTime: 2023-02-07 10:31:06
 */
import vue from 'vue'
import MainNotify from './index.vue'

const AudioConstructor = vue.extend(MainNotify)

let instance: Vue

let alreadySet = false

export const NotifyMp4Message = () => {
  if (alreadySet === true) {
    (instance?.$el as HTMLAudioElement)?.play()
    return
  }

  instance = new AudioConstructor()

  instance.$mount()

  document.body.appendChild(instance.$el)

  alreadySet = true;

  (instance?.$el as HTMLAudioElement).play()
}
