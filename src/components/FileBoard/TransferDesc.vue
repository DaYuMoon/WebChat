<!--
 * @Description:
 * @Date: 2023-03-02 14:59:21
 * @LastEditTime: 2023-03-02 15:28:41
-->
<script lang="ts" setup>
interface Props {
  /**
   * 类型 '发送' | '接收'
   */
  type: 'send' | 'accept'
  /**
   * 文件名
   */
  filename: string
  /**
   * 进度描述
   */
  progressDesc: string
}

defineProps<Props>()
</script>

<template>
  <div class="sending border-solid border-blue-500\/50 border-1 rounded-xl min-h-10 p-2 mt-2 ">
    <p class="flex items-center ">
      <CryptocurrencyColorXpa v-if="type === 'send'" />
      <SkillIconsViteLight v-else />
      <span class="mr-2 ml-2">正在{{ type === 'accept' ? '接收' : '发送' }}文件  </span>
      <!-- <emojione-antenna-bars class="mr-2" /> -->
      <SvgSpinners3DotsBounce class="text-white " />
    </p>
    <p class="break-all text-white ">
      {{ filename }}
    </p>
    <i class="i-svg-spinners-blocks-shuffle-3 " />
    <p>传输进度 <SvgSpinnersBlocksShuffle3 class="text-gray-100 inline ml-2" /> </p>
    <p class="break-all text-green-700 ">
      {{ progressDesc }}
    </p>
  </div>
</template>

