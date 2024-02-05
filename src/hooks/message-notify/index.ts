/*
 * @Description:
 * @Date: 2022-08-16 16:12:00
 * @LastEditTime: 2024-02-05 09:57:45
 */
import vue from 'vue'
import MainNotify from './index.vue'

const AudioConstructor = vue.extend(MainNotify)

let instance: Vue

let alreadySet = false

export const NotifyMp4Message = () => {
  if (!alreadySet) {
    instance = new AudioConstructor()

    instance.$mount()

    document.body.appendChild(instance.$el)

    alreadySet = true
  }

  (instance?.$el as HTMLAudioElement).play()
}
