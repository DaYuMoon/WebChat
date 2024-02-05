<!--
 * @Description: 聊天面板
 * @Date: 2022-08-06 00:23:24
 * @LastEditTime: 2023-02-07 12:09:27
-->
<script lang="ts" setup>
// import { computed, onBeforeMount, ref, toRef, toRefs } from 'vue'
// import { connect, useChat } from '@/hooks/socket'
// import store from '@/store'

// import ChatHeader from './components/Header.vue'
import ChatBoard from './components/Chat.vue'
import ChatSidebar from './components/Sidebar.vue'
</script>

<template>
  <div id="chat-panel" class="border-solid border-sky-50  border">
    <!-- <ChatHeader class="header-bar" /> -->
    <section class="main-container flex">
      <ChatSidebar class="w-1/4 bg-slate-300 " />
      <ChatBoard class="w-3/4 bg-orange-300" />
    </section>
  </div>
</template>

<style lang="scss" scoped>
#chat-panel {
  width: 100%;
  height: 100%;

  $header-height: 0px;
  .header-bar {
    height: $header-height;
  }
  .main-container {
    height: calc(100% - #{$header-height});
  }
}
</style>
