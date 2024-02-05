/*
 * @Description:
 * @Date: 2023-04-21 11:58:07
 * @LastEditTime: 2023-04-23 15:49:49
 */

import { useClipboard, useTextSelection } from '@vueuse/core'
import { createVueCons } from './common'
import store from '@/store'
import MaterialSymbolsContentCopyOutlineSharpVue from '@/components/CustomIcons/MaterialSymbolsContentCopyOutlineSharp.vue'
import MaterialSymbolsAutoDeleteOutlineVue from '@/components/CustomIcons/MaterialSymbolsAutoDeleteOutline.vue'

const CopyComp = createVueCons(MaterialSymbolsContentCopyOutlineSharpVue)
const DeleteComp = createVueCons(MaterialSymbolsAutoDeleteOutlineVue)

const state = useTextSelection()
const { copy } = useClipboard({ legacy: true })

const style = {
  content: 'display:flex;align-items:center;font-size:14px',
  icon: 'font-size:16px',
  text: 'margin-left:5px',
}

/**
 * 创建菜单项的内容
 * @param menuName - 菜单名
 * @param iconHTML - 菜单 icon (可选)
 */
function createMenuText(menuName: string, iconHTML?: string): string {
  iconHTML = iconHTML ? `<span style="${style.icon}">${iconHTML}</span>` : ''

  return `<div style=${style.content}>
            ${iconHTML}
            <span style="${style.text}">${menuName}</span>
          </div>`
}

/**
 * 使用右键菜单
 * @param chatItem - 聊天
 */
export function chatContextmenu(chatItem: SendPrivateChat) {
  return [
    {
      text: createMenuText('复制', CopyComp.$el.outerHTML),
      subText: '复制文字',
      action: () => {
        let word = ''
        if (state.text.value)
          word = state.text.value

        else
          word = chatItem.msg

        copy(word)
      },
    },
    {
      divider: true,
    },
    {
      text: createMenuText('删除', DeleteComp.$el.outerHTML),
      subText: '删除这条记录',
      action: () => {
        store.commit('DEL_CUR_CHAT_LOG', chatItem)
      },
    },
  ]
}
