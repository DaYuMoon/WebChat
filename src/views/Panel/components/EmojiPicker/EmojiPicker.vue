<!--
 * @Description: emoji 表情选择
 * @Date: 2022-08-11 17:12:29
 * @LastEditTime: 2023-02-06 17:30:09
-->
<script lang="ts" setup>
import { computed, onBeforeMount } from 'vue'
import { emojis } from './emoji'
import store from '@/store'

const emit = defineEmits<{
  /**
   * 触发点击 emoji
   */
  (e: 'handleClick', emoji: string): string
}>()

onBeforeMount(() => {
  store.dispatch('handleCurrentEmoji', 'get')
})

const sourceEmojiList = Object.values(emojis)

const currentEmoji = computed(() => store.state.currentEmoji)

const emojiList = computed(() => {
  if (currentEmoji.value.length) {
    const current: typeof sourceEmojiList[number] = {
      description: '最近使用',
      content: currentEmoji.value,
    }
    return [current, ...sourceEmojiList]
  }
  else { return sourceEmojiList }
})

/**
 * 点击表情
 * @param emoji
 */
function clickEmoji(emoji: string) {
  store.commit('PUSH_CURRENT_EMOJI', emoji)
  store.dispatch('handleCurrentEmoji', 'set')

  emit('handleClick', emoji)
}
</script>

<template>
  <div class="emoji-picker w-96   h-80 overflow-y-auto bg-white rounded-xl px-2 py-2 box-border ">
    <div v-for="(item, index) in emojiList" :key="index" class="mb-3 ">
      <div class="title text-black  ">
        {{ item.description }}
      </div>
      <section class="flex flex-wrap justify-around ">
        <span v-for="(emoji, key) in item.content" :key="key" class="w-12 h-12 text-xl  leading-12 cursor-pointer text-center hover:bg-slate-200 " @click="clickEmoji(emoji)">
          {{ emoji }}
        </span>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/global.scss';

.emoji-picker {
  @include thin-scrollbar;
}
</style>
