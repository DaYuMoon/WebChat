<!--
 * @Description:
 * @Date: 2022-08-16 16:12:12
 * @LastEditTime: 2023-02-07 10:30:34
-->

<script lang="ts" setup>
import { ref } from 'vue'
import toastMp3 from '@/assets/14122.mp3'

const audioRef = ref<HTMLAudioElement | null>(null)
const playAudio = () => {
  audioRef.value?.play()
}

defineExpose({ playAudio })
</script>

<template>
  <audio ref="audioRef" :src="toastMp3" />
</template>
