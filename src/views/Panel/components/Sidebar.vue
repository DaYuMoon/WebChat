<!--
 * @Description:
 * @Date: 2022-08-06 15:23:45
 * @LastEditTime: 2023-04-24 10:51:08
-->
<script lang="ts" setup>
import type { ComputedRef, Ref } from 'vue'
import { computed, ref, toRef, toRefs } from 'vue'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import store, { MATCH_KEY } from '@/store'

dayjs.extend(isToday)

const { userList, currentChatting, userInfo, chatHistory, messageAlert } = toRefs(store.state)

/**
 * 离线用户
 */
const offlineHistoryUser: Ref<HistoryUserInfo[]> = toRef(store.getters, 'offlineHistoryUser')

/**
 * 对应的各个最近一条聊天记录
 */
const lastTimeMessageList = computed(() => {
  if (!Object.keys(chatHistory.value).length) {
    return userList.value.map((user) => {
      return { [MATCH_KEY]: user[MATCH_KEY], msg: '', time: 0 }
    })
  }
  return Object.entries(chatHistory.value).map(([key, value]) => {
    let lastMessage = ''
    let time = 0
    if (value.length) {
      const { msg, time: lastTime } = value[value.length - 1]
      lastMessage = msg
      time = lastTime as number || 0
    }
    return { [MATCH_KEY]: key, msg: lastMessage, time }
  })
})

/**
 * 根据最后的消息时间, 再与 userList 过滤得出排序
 * @description 根据 消息时间 将用户列表排序
 */
const sortUsersByLastMessageTime: ComputedRef<HistoryUserInfo[]> = computed(() => {
  // 1. 对最后一次消息时间进行降序排序
  const shallowClone = [...lastTimeMessageList.value]
  shallowClone.sort((a, b) => {
    return a.time < b.time ? 1 : -1
  })

  const sortUserByLastMsgTime: HistoryUserInfo[] = []
  shallowClone.forEach((msgInfo) => {
    // 2. 从降序排序的数组中, 匹配对应的用户 (此时已经将有聊天记录的用户根据时间排序了)
    const matchUser = userList.value.find(user => user[MATCH_KEY] === msgInfo[MATCH_KEY])
    if (matchUser)
      sortUserByLastMsgTime.push({ ...matchUser, online: 1 })
  })

  // 3. 把没有聊天记录的用户拉取出来
  const unSortUsers: HistoryUserInfo[] = []
  userList.value.forEach((user) => {
    const notExist = sortUserByLastMsgTime.every(sortUser => sortUser[MATCH_KEY] !== user[MATCH_KEY])
    if (notExist) {
      unSortUsers.push({
        ...user,
        online: 1,
      })
    }
  })

  // 4. 把 离线且存在对话过的对话历史记录的用户 取出来 (匹配离线且存在对话记录的用户)
  const offlineHistoryChatUser = offlineHistoryUser.value.filter((history) => {
    const matchOfflineHistory = lastTimeMessageList.value.some(msgInfo => msgInfo[MATCH_KEY] === history[MATCH_KEY])
    return matchOfflineHistory
  })

  // 5. 显示所有用户 = 有历史聊天记录的(根据时间降序排序) + 没有历史聊天记录的用户
  return [...sortUserByLastMsgTime, ...unSortUsers, ...offlineHistoryChatUser]
})

/**
 * 切换当前聊天
 * @param userInfo - 用户信息
 */
function switchChatting(userInfo: UserInfo) {
  store.commit('SET_CURRENT_CHATTING', userInfo)
}

/**
 * 格式化用户名显示
 * @param userInfo
 */
function normalizeNickname(userInfo: UserInfo) {
  const { ip, nickname } = userInfo
  return nickname || ip
}

/**
 * 搜索条件
 */
const userFilterKey = ref('')
/**
 * 根据搜索条件过滤用户
 */
const filterUsers: ComputedRef<UserInfo[]> = computed(() => {
  const list = sortUsersByLastMessageTime.value
  if (!userFilterKey.value.trim())
    return list

  return list.filter(({ nickname, ip }) => {
    const matchNickname = nickname?.includes(userFilterKey.value)
    if (matchNickname)
      return true

    const matchIp = ip.includes(userFilterKey.value)
    if (matchIp)
      return true

    return false
  })
})

/**
 * 匹配最近一条聊天记录
 */
function matchLastTimeMessage(userInfo: UserInfo) {
  const msgInfo = lastTimeMessageList.value.find((msgInfo) => {
    return msgInfo[MATCH_KEY] === userInfo[MATCH_KEY]
  })
  return msgInfo?.msg ?? ''
}

function formatChatLastTime(userInfo: UserInfo): string {
  const userId = userInfo[MATCH_KEY]
  const msgInfo = lastTimeMessageList.value.find((msgInfo) => {
    return msgInfo[MATCH_KEY] === userId
  })
  const time = msgInfo?.time || 0

  if (time) {
    let formatter = ''
    // 1. 是今天则显示具体时间 HH:mm
    // 2. 不是今天则直接显示日期 MM/DD
    const today = dayjs(time).isToday()
    formatter = today ? 'HH:mm' : 'MM/DD'

    return dayjs(time).format(formatter)
  }
  else { return '' }
}

/**
 * 判断是否需要提示新消息 bell
 */
function mayShowAlert(userInfo: UserInfo): boolean {
  const userId = userInfo[MATCH_KEY] as string || ''
  return userId in messageAlert.value
}

/**
 * 格式化头像描述
 * @param userInfo
 */
function formatterAvatarDes(userInfo: UserInfo) {
  const { nickname, ip } = userInfo
  let des = ''
  if (nickname) {
    des = nickname.length ? nickname.slice(-2) : nickname
  }
  else if (ip) {
    const ips = ip.split('.')
    des = ips[ips.length - 1]
  }
  return des
}
</script>

<template>
  <div id="chat-sidebar" class="overflow-hidden border-r border-slate-200">
    <header
      class="bg-white search px-3.5 py-3.5 border-b border-solid "
    >
      <el-input v-model.lazy="userFilterKey" size="small" prefix-icon="el-icon-search" placeholder="搜索用户(ip/用户名)" clearable />
    </header>

    <div class=" userList overflow-auto pl-1 pt-1 thin-scrollbar bg-white">
      <div v-for="user in filterUsers" :key="user.id" class="chat-item px-2 py-2 mr-1  flex hover:bg-gray-200 hover:cursor-pointer rounded-md mb-1 relative text-sm " :class="{ 'bg-gray-100': currentChatting.id === user.id }" @click="switchChatting(user)">
        <!-- 离线 icon 提示 start -->
        <!-- <carbon-cloud-offline /> -->
        <clarity-disconnected-solid v-if="!user.online" class="absolute left-1 top-1 z-10" />
        <!-- 离线 icon 提示  end -->

        <div class="relative w-10 h-10" :class="{ 'avatar-toast': mayShowAlert(user) }">
          <el-avatar
            class="absolute top-0 left-0"
            style="color: #fff;"
            :style="{
              backgroundColor: user.online ? '#4ECDC4' : '#556270',
            }"
            size="large"
            shape="square"
          >
            <!-- :shape="mayShowAlert(user) ? 'circle' : 'square'" -->
            {{ formatterAvatarDes(user) }}
          </el-avatar>
        </div>
        <div class="user-details flex flex-col ml-2 w-[calc(100%-2.5rem-2.5rem-0.5rem-0.5rem)]  ">
          <span
            class="truncate "
            :class="[user.id === userInfo.id ? 'text-sky-600' : 'text-black']"
            :title="`${normalizeNickname(user)}${user.id === userInfo.id ? '(我)' : ''}`"
          >  {{ normalizeNickname(user) }} {{ user.id === userInfo.id ? '(我)' : '' }}</span>
          <span class="truncate text-gray-500">{{ matchLastTimeMessage(user) }}</span>
        </div>
        <div class="ml-2 w-10 flex flex-col justify-between items-center">
          <div class="text-gray-400 text-sm ">
            {{ formatChatLastTime(user) }}
          </div>
          <span v-show="mayShowAlert(user)" class="inline-flex">
            <emojione-v1-fire class="animation-toast mr-1" />
            <emojione-v1-ringing-bell />
            <!-- <CryptocurrencyColorXpa title="有文件" /> -->
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#chat-sidebar {
  $search-height: 60px;

  user-select: none;
  .search {
    height: $search-height;
    box-sizing: border-box;
  }
  .userList {
    height: calc(100% - #{$search-height});
    box-sizing: border-box;

    &::-webkit-scrollbar {
      width: 6px;
      height: 4px;
    }
    &::-webkit-scrollbar-thumb:vertical {
      width: 6px;
      height: 4px;
      background-color: rgb(123, 167, 188);
      border-radius: 6px;
    }
  }
}

.animation-toast {
  animation: toast 1s alternate-reverse infinite linear;
}

@keyframes toast {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* 头像转动特效 */
.avatar-toast {
  $toast-width: 2px;

  position: relative;
  border: $toast-width;
  background-clip: padding-box; /*important*/

  /* NOTE: 圆形环绕转动特效, 模拟跑马灯 */
  &:before {
    content: '';
    width: 111%;
    height: 111%;
    position: absolute;
    top: 50%;
    left: 50%;

    border-radius: 50%;
    border: 6px solid transparent;
    background-clip: padding-box, border-box;
    background-origin: padding-box, border-box;
    // background-image: linear-gradient(to right, #222, #222), linear-gradient(#71d8f1, #4a58f3, rgb(112, 108, 153));;

    background-image: linear-gradient(to right, #222, #222), linear-gradient(to right, #eea2a2 0%, #bbc1bf 19%, #57c6e1 42%, #b49fda 79%, #7ac5d8 100%);

    animation: avatar-toast 2s infinite linear;
  }
}

@keyframes avatar-toast {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
