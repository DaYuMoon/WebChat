<!--
 * @Description:
 * @Date: 2022-08-06 15:23:36
 * @LastEditTime: 2024-01-11 10:09:08
-->
<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, toRefs, watch, watchEffect } from 'vue'
import { Input as ElInput, Message, Message as messageToast } from 'element-ui'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import { onClickOutside } from '@vueuse/core'
import EmojiPicker from './EmojiPicker/EmojiPicker.vue'
import UserSetting from './UserSetting/index.vue'
import FileBoard from '@/components/FileBoard/FileBoard.vue'
import VscodeIconsFileTypeConfig from '~icons/vscode-icons/file-type-config'
import EmojioneFaceWithTearsOfJoy from '~icons/emojione/face-with-tears-of-joy'

import { chatEvents } from '@/adapter'
import store, { MATCH_KEY } from '@/store'
import { dropHandler } from '@/utils/drag-file'
import { InstallSocketToTransferFile } from '@/utils/WebRTC-connect/state'
import { chatContextmenu } from '@/utils/chat-contextmenu'
import { fileTransTipsEnum } from '@/enum/fileTransferEnum'

dayjs.extend(isToday)
const { currentChatting, userInfo, currentChatLogs: chatHistory, userList } = toRefs(store.state)

const installFileTransferWithSocket = new InstallSocketToTransferFile()

/**
 * 是否打开用户设置面板
 */
const userSettingVisible = ref(false)

/**
 * 是否打开文件列表面板
 */
const isOpenFileBoard = ref(false)

const SCROLL_TRIGGER_MAX = 150 // 滑动距离 - 触发显示"有新消息"提示
const SCROLL_TRIGGER_MIN = 60 // 离底部最小的距离 - 小于时则隐藏"有新消息"提示
const OFFLINE_WORDS = '用户已离线, 不可发送消息 !' // 离线提示语句

const message = ref('') // 输入框的内容
const chatMessageBoard = ref<HTMLDivElement | null>(null) // 聊天板 ref
const showNewMsgTips = ref(false) // 显示新消息提示

const messageInput = ref<InstanceType<typeof ElInput>>()

watch(currentChatting, () => {
  // 切换对话用户时, 如果有新消息提示还没点, 则直接隐藏
  showNewMsgTips.value = false

  // 聚焦 input
  messageInput.value?.focus()
}, { deep: true, immediate: true })

/**
 * 该对话的用户是否已经下线
 */
const isOffline = computed(() => {
  if (!currentChatting.value?.userId)
    return false
  return userList.value.every(user => user[MATCH_KEY] !== currentChatting.value[MATCH_KEY])
})

/**
 * 是否禁止使用 input 和 发送的 button
 */
const disabledInput = computed(() => {
  return !currentChatting.value.id
})

/**
 * 聊天历史记录
 */
watchEffect(() => {
  if (chatHistory.value.length) {
    if (chatMessageBoard.value) {
      const currentScrollY = getChatBoardScrollPosition()

      if (currentScrollY >= SCROLL_TRIGGER_MAX)
        showNewMsgTips.value = true

      else
        nextTick(scrollMessageToBottom)
    }
  }
})
onMounted(() => {
  nextTick(scrollMessageToBottom)

  // 为聊天板添加滚动事件
  if (chatMessageBoard.value) {
    chatMessageBoard.value.addEventListener('scroll', (e) => {
      // 当出现"新消息"提示时, 如果滚动位置达到了, 则取消显示
      if (showNewMsgTips.value === true) {
        const currentScrollY = getChatBoardScrollPosition()

        if (currentScrollY < SCROLL_TRIGGER_MIN)
          showNewMsgTips.value = false
      }
    })
  }
})

/**
 * 发送消息 (点击事件与键盘事件公用)
 */
function sendMessage(e: KeyboardEvent, type: 'keydown' | 'enter' = 'enter') {
  // 发送消息
  const ifEnter = () => {
    if (isOffline.value) {
      messageToast.info(OFFLINE_WORDS)
      return
    }

    if (!message.value) {
      messageToast.info('输入消息不能为空!')
      return
    }

    const chatItem: SendPrivateChat = {
      toUser: currentChatting.value,
      fromUser: userInfo.value,
      msg: message.value,
    }

    chatEvents?.sendPrivateMessage(chatItem)

    // 清空输入框的值
    message.value = ''
  }

  if (type === 'keydown') {
    // enter 事件
    if (!e.shiftKey && e.key === 'Enter') {
      e.cancelBubble = true // 阻止冒泡
      e.stopPropagation()
      e.preventDefault()
      ifEnter()
    }
  }
  else if (type === 'enter') {
    ifEnter()
  }
}

/**
 * 将消息滚动到底部
 */
function scrollMessageToBottom() {
  showNewMsgTips.value = false
  if (chatMessageBoard.value)
    chatMessageBoard.value.scrollTop = chatMessageBoard.value.scrollHeight
}

/**
 * 获取聊天板区域滚动位置离底部的高度
 * @default 0
 */
function getChatBoardScrollPosition(): number {
  if (chatMessageBoard.value) {
    const { scrollHeight, clientHeight, scrollTop } = chatMessageBoard.value

    const currentScrollY = scrollHeight - clientHeight - scrollTop

    return currentScrollY
  }
  return 0
}

/**
 * 格式化显示聊天时间
 * @param time - 时间戳
 */
function formatterChatTime(time = 0) {
  const today = dayjs(time).isToday()
  const formatter = today ? 'HH:mm:ss' : 'MM-DD HH:mm'
  return dayjs(time).format(formatter)
}

// NOTE: 输入框事件 start
/**
 * 是否聚焦到输入框
 */

// 最后一次聚焦时, 输入框光标所在的索引位置
let lastRegisteredIndex = 0
function handleMessageInput() {
  lastRegisteredIndex = getSelectionStartIndex()
}
function handleClickMessageInput() {
  lastRegisteredIndex = getSelectionStartIndex()
}
/**
 * 获取文本输入框的光标位置索引
 */
function getSelectionStartIndex(): number {
  let index = 0
  if (messageInput.value?.$el) {
    const textareaDom = messageInput.value.$el.querySelector('textarea')

    if (textareaDom?.selectionStart)
      index = textareaDom.selectionStart
  }

  return index
}
/**
 * 依据索引,设置文本输入框的光标位置
 * @param index - 光标需要出现在的索引位置
 */
function setMessageInputSelection(index: number) {
  if (messageInput.value?.$el) {
    const textareaDom = messageInput.value.$el.querySelector('textarea')

    if (textareaDom && textareaDom.selectionStart !== null) {
      // 输入框聚焦
      textareaDom?.focus()

      nextTick(() => {
        // 以下这三个方法都可以设置光标位置
        // 方法 1:
        textareaDom.setSelectionRange(index, index)

        // 方法 2:
        // textareaDom.setRangeText(' ', index, index, 'end')

        // 方法 3:
        // textareaDom.selectionStart = index
        // textareaDom.selectionEnd = index

        // 更新光标的最后一个位置
        lastRegisteredIndex = index
      })
    }
  }
}
// NOTE: 输入框事件 end

const showEmoji = ref(false)
const emojiPickerRefs = ref(null)

// 当点击 emojiPicker 外部时, 则隐藏 emojiPicker
onClickOutside(emojiPickerRefs, (event) => {
  showEmoji.value = false
})

/**
 * 添加 emoji 表情到输入文本中
 * @param emoji - emoji表情字符
 */
function outputEmoji(emoji: string) {
  // 往焦点位置输入内容
  message.value = `${message.value.slice(0, lastRegisteredIndex)}${emoji}${message.value.slice(lastRegisteredIndex)}`

  const focusIndex = lastRegisteredIndex + emoji.length
  setMessageInputSelection(focusIndex)

  // 隐藏表情选择框
  showEmoji.value = false
}

/**
 * 拖拽文件
 */
async function handleDropFile(evt: DragEvent) {
  try {
    const file = dropHandler(evt)

    // 不允许自己发送给自己
    if (currentChatting.value.userId === userInfo.value.userId) {
      Message.info('😅 不允许发送给自己...')
      return
    }

    // 不允许发送给离线用户
    if (isOffline.value) {
      Message.warning('😅 不允许向已下线的用户发送 "文件/消息"... ')
      return
    }

    // 需要先选择一个用户
    if (!currentChatting.value.id) {
      Message.warning('你要发文件给谁呢 😅 , 快选一个人先" !')
      return
    }

    if (file)
      installFileTransferWithSocket.beforeSendFile(currentChatting.value, file)
  }
  catch (e) {
    console.log(e)
    Message.error((e as any)?.message)
  }
}
function dragoverHandler(e: DragEvent) {
  e.preventDefault()
}
</script>

<template>
  <div id="chat-main" @drop.capture="handleDropFile($event)" @dragover="dragoverHandler($event)">
    <header class="bg-gray-50 h-10 leading-10 px-3 box-border border-b border-gray-200 flex justify-between items-center relative ">
      <div>
        {{ currentChatting.nickname ? `${currentChatting.nickname} ( ip: ${currentChatting.ip} )` : currentChatting.ip }} {{ isOffline ? ' (用户已离线)' : '' }}
      </div>

      <!-- 功能列表 - 条形 start -->
      <div class="features-list inline-flex">
        <FileBoard
          v-show="!isOpenFileBoard"
          :open.sync="isOpenFileBoard"
          display-type="inline"
        />
        <span
          title="文件列表"
          class="cursor-pointer inline-flex items-center"
          @click="
            () => {
              isOpenFileBoard = !isOpenFileBoard
            }"
        >
          <mdi-folder-arrow-up-down-outline />
        </span>
      </div>
      <!-- 功能列表 - 条形  end -->

      <!-- 功能列表 - 面板类型 start -->
      <transition
        enter-active-class="animate-animated animate-fadeInDown"
        leave-active-class="animate-animated animate-fadeOutRight"
      >
        <div v-show="isOpenFileBoard" class="fixed top-7 right-7">
          <FileBoard :open.sync="isOpenFileBoard" display-type="block" />
        </div>
      </transition>

      <!-- 功能列表 - 面板类型  end -->
    </header>

    <main ref="chatMessageBoard" class="bg-gray-100 thin-scrollbar h-[calc(100%-2.5rem-11rem)] px-3 py-3  box-border overflow-y-auto text-sm " :class="{ 'scroll-smooth': showNewMsgTips }">
      <div v-for="(chatItem, index) in chatHistory" :key="chatItem.time || index" class="flex flex-col mb-4" :class="[userInfo[MATCH_KEY] === chatItem.fromUser[MATCH_KEY] ? 'items-end  ' : 'items-start ']">
        <span class="text-gray-500">
          <!-- {{ chatItem.fromUser.nickname || chatItem.fromUser.ip }} ({{ formatterChatTime(chatItem?.time || 0) }}) : -->
          {{ formatterChatTime(chatItem?.time || 0) }}
        </span>

        <!-- 聊天消息 start -->
        <p
          v-contextmenu="() => chatContextmenu(chatItem)"
          class="decoration-talk inline-block bg-white rounded-xl px-4 py-2 mt-1 max-w-md word-break: break-all whitespace-pre-wrap "
          :class="[
            userInfo[MATCH_KEY] === chatItem.fromUser[MATCH_KEY] ? 'message-content__mine message__mine' : 'bg-white message__other',
          ]"
          v-text="chatItem.msg"
        />
        <!-- 聊天消息  end -->
      </div>
    </main>

    <footer class="h-44  px-3 pt-3 box-border bg-white relative  border-t border-gray-200 select-none">
      <!-- 新消息提示, 点击滑动 start -->
      <span
        v-show="showNewMsgTips"
        class="absolute inline-flex items-center text-sky-400  cursor-pointer "
        style="top: -30px; left: 50%; transform: translate(-50%, 0);"
        @click="scrollMessageToBottom"
      >
        <!-- <span>💬</span> -->
        <jam-message-writing-f />
        <span>&nbsp;新消息&nbsp;</span>
        <material-symbols-keyboard-double-arrow-down />
        <!-- <i class="el-icon-arrow-down" /> -->
      </span>
      <!-- 新消息提示, 点击滑动  end -->

      <EmojiPicker
        v-show="showEmoji"
        ref="emojiPickerRefs"
        class="slow-open absolute left-1"
        style="bottom: 105%"
        @handleClick="outputEmoji"
      />

      <!-- 聊天输入框功能栏 start -->
      <div class="h-10 leading-10">
        <span
          class="cursor-pointer inline-block"
          title="表情选择器"
          @click="showEmoji = !showEmoji"
        >
          <!-- <bi-emoji-sunglasses /> -->
          <EmojioneFaceWithTearsOfJoy />
        </span>

        <!-- 用户设置 start -->
        <span
          class="setting-rotate-animate cursor-pointer inline-block ml-2"
          title="用户设置"
          @click="userSettingVisible = true"
        >
          <VscodeIconsFileTypeConfig />
        </span>
        <!-- 用户设置  end -->
      </div>
      <!-- 聊天输入框功能栏  end -->

      <ElInput
        ref="messageInput"
        v-model="message"
        class="thin-scrollbar"
        size="large"
        type="textarea"
        clearable
        resize="none"
        :disabled="disabledInput"
        :autosize="{ minRows: 3, maxRows: 3 }"
        :placeholder="fileTransTipsEnum.REMINDER"
        @keydown.native="sendMessage($event, 'keydown')"
        @drop.capture="handleDropFile($event)"
        @dragover="dragoverHandler($event)"
        @keyup.native="handleMessageInput"
        @click.native="handleClickMessageInput"
      />
      <div class="absolute bottom-2.5 right-3 text-xs">
        <span class="text-gray-700">{{ fileTransTipsEnum.SHORT_REMINDER }}</span>
        <span v-if="isOffline" class="text-red-500 mr-3">
          ( {{ OFFLINE_WORDS }} )
        </span>
        <span class="mx-2 text-gray-400 ">Shift+Enter 换行, Enter 发送 </span>
        <el-button
          class="!px-6"
          type="primary"
          size="mini"
          :disabled="disabledInput || isOffline"
          alt="123123"
          @click="sendMessage($event, 'enter')"
        >
          发送
        </el-button>
      </div>
    </footer>

    <!-- 对话框 - 用户设置 start -->
    <UserSetting :visible.sync="userSettingVisible" />
    <!-- 对话框 - 用户设置  end -->
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/global.scss';

:deep(textarea) {
  @include thin-scrollbar;
}

.slow-open {
  animation: slow-open .5s linear;
}

@keyframes slow-open {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* 调整聊天内容中 v-html 的样式 */
:deep(.decoration-talk) {
  /* <a> 标签强调显示 */
  a {
    text-decoration: underline !important;
    color: rgb(105, 191, 224) !important;
  }
}

.message {
  &-content__mine {
    background-color: #b7e8ff;
  }

  &__mine {
    border-top-right-radius: 0;
  }

  &__other {
    border-top-left-radius: 0;
  }
}

.setting-rotate-animate {
  animation: setting-icon-rotate infinite 8s linear;
}
@keyframes setting-icon-rotate {
  0% {
    rotate: 0deg;
  }
  100% {
    rotate: 360deg;
  }
}
</style>
