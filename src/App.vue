<!--
 * @Description:
 * @Date: 2022-07-26 01:43:10
 * @LastEditTime: 2023-03-03 11:01:15
-->
<script lang="ts" setup>
import { dispatch as dispatchChatEvent } from '@/adapter'

dispatchChatEvent()
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style>
html, body, #app {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  min-width: 900px;
  min-height: 600px;
}
</style>
