<!--
 * @Description: 文件 接收/发送 面板
 * @Date: 2023-03-01 09:50:50
 * @LastEditTime: 2023-03-02 19:00:26
-->
<script lang="ts">
</script>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import fileSaver from 'file-saver'
import { Option as ElOption, Select as ElSelect } from 'element-ui'
import TransferDesc from './TransferDesc.vue'
import { currentUserTransfer } from '@/utils/WebRTC-connect/state'
import { formatFileSize } from '@/utils/common'
import type { AcceptFilesItem } from '@/utils/WebRTC-connect/typing'

const props = withDefaults(defineProps<Props>(), {
  displayType: 'block',
})

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
}>()

interface Props {
  /**
   * 显示方式
   * @default 行外
   */
  displayType: 'inline' | 'block'
  /**
   * 是否打开弹窗
   */
  open: boolean
}

/**
 * 接收的所有文件
 */
const acceptFiles = computed(() => currentUserTransfer.value?.acceptFiles || [])
/**
 * 发送的所有文件
 */
const sendFiles = computed(() => currentUserTransfer.value?.sendFiles || [])
/**
 * 正在接收的文件
 */
const accepting = computed(() => currentUserTransfer.value?.accepting || null)
/**
 * 正在发送的文件
 */
const sending = computed(() => currentUserTransfer.value?.sending || null)

watch(currentUserTransfer, () => {})

/**
 * 上传状态进度描述
 */
const sendingDesc = computed(() => {
  return currentUserTransfer.value?.fileTransferIns?.progressReactive.desc || ''
})
/**
 * 上传的文件名称
 */
const sendingFilename = computed(() => sending.value?.filename || '')

/**
 * 接收状态进度描述
 */
const acceptingDesc = computed(() => {
  return accepting.value?.acceptingDesc || ''
})
/**
 * 当前文件接收名字
 */
const acceptingFilename = computed(() => accepting.value?.filename || '')

/**
 * 是否存在接收的文件 (接收列表有内容或者有正在接收的文件都算)
 */
const gotAccept = computed<boolean>(() => {
  return Boolean(accepting.value) || Boolean(acceptFiles.value.length)
})
watch(gotAccept, (val) => {
  if (val === true) {
    // 打开弹窗
    emit('update:open', true)
    // 打开接收页
    activeTab.value = 'acceptFiles'
  }
})
watch(sending, (val) => {
  if (val) {
    // 打开弹窗
    emit('update:open', true)
    // 打开发送页
    activeTab.value = 'sendFiles'
  }
})

/**
 * 下载文件
 * @param fileItem
 */
function downloadFile(fileItem: AcceptFilesItem) {
  const dataArrayBuffer = fileItem.buffer as ArrayBuffer[] || []
  const blob = new Blob(dataArrayBuffer)
  const downloadUrl = URL.createObjectURL(blob)
  fileSaver.saveAs(downloadUrl, fileItem.filename)
}

const tabList = [
  { label: '已接收的文件', value: 'acceptFiles' },
  { label: '已发送的文件', value: 'sendFiles' },
  // { label: '正在发送', value: 'sendFiles' },
] as const

type ActiveTabValue = (typeof tabList[number])['value']
/**
 * 当前选择的 tab
 */
const activeTab = ref<ActiveTabValue>(tabList[0].value)

defineExpose({ currentUserTransfer })
</script>

<template>
  <div id="file-list-board">
    <!-- 行外一块 start -->

    <section
      v-if="displayType === 'block'"
      class="rounded-xl bg-purple-300/70 w-64 min-h-56
      text-sm  p-2 block-bg-gradient
        "
    >
      <ElSelect v-model="activeTab" size="mini" class="m-auto w-full">
        <ElOption
          v-for="item in tabList"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>

      <!-- 接收的文件 start -->
      <div
        v-if="activeTab === 'acceptFiles'"
        class="inline-flex flex-col items-center w-full min-h-56 max-h-80 overflow-auto thin-scrollbar"
      >
        <span
          v-for="item in acceptFiles"
          :key="item.id"
          class="mt-1 w-full"
        >
          <!-- border-blue-400\/10 -->
          <p
            class="m-0 not-italic text-gray-700 hover:text-sky-600 cursor-pointer overflow-ellipsis break-all border-solid border-gray-200  border-1 rounded-md p-1 mt-1"
            :title="`下载 '${item.filename}''`"
            @click="downloadFile(item)"
          >
            {{ item.filename }}
            <span class="text-blue-600 hover:text-sky-600 text-xs">
              ({{ formatFileSize(item.totalSize, 2) }})
            </span>
          </p>
        </span>
      </div>
      <!-- 接收的文件  end -->

      <!-- 发送的文件 start -->
      <div
        v-if="activeTab === 'sendFiles'"
        class="inline-flex flex-col items-center w-full min-h-56 max-h-80 overflow-auto thin-scrollbar"
      >
        <span
          v-for="item in sendFiles"
          :key="item.id"
          class="mt-1 w-full"
        >
          <p
            class=" m-0 not-italic hover:text-sky-600 cursor-pointer overflow-ellipsis break-all  border-solid border-gray-200  border-1 rounded-md p-1 mt-1"
            :title="`'${item.filename}' / 大小:(${formatFileSize(item.size, 2)})`"
          >
            {{ item.filename }}
            <span class="text-blue-600 hover:text-sky-600 text-xs">
              ({{ formatFileSize(item.size, 2) }})
            </span>
          </p>
        </span>
      </div>
      <!-- 发送的文件  end -->

      <!-- 正在发送的文件 start -->
      <TransferDesc
        v-if="sending"
        type="send"
        :filename="sending?.filename || ''"
        :progress-desc="sendingDesc"
      />
      <!-- 正在发送的文件  end -->

      <!-- 正在接收的文件 start -->
      <TransferDesc
        v-if="accepting"
        type="accept"
        :filename="accepting?.filename || ''"
        :progress-desc="acceptingDesc"
      />
      <!-- 正在接收的文件  end -->

      <footer
        class="text-gray-100 mt-2 mb-1 flex justify-center items-center cursor-pointer"
        title="收起"
        @click="emit('update:open', false)"
      >
        <!-- @click="emit('update:open', false)" -->
        <span>收起</span> <jam-arrow-square-right class="inline ml-1" />
      </footer>
    </section>

    <!-- 行外一块  end -->

    <!-- 行内一条 start -->
    <section v-show="props.displayType === 'inline'" class="inline-flex mr-2">
      <span
        v-if="sending"
        class="sending test-xs inline-flex items-center"
      >
        <span class="text-sky-600">发送</span>
        <SvgSpinners3DotsBounce class="text-purple-400  mr-1 ml-1 " />
        <p class="text-sm not-italic truncate max-w-40 ">{{ sendingFilename }}</p>
        <em class="text-sm not-italic ml-1 mr-1 text-green-600">
          {{ sendingDesc }}
        </em>
        <SvgSpinnersBlocksShuffle3 class="text-gray-400 inline" />
      </span>

      <span
        v-if="accepting !== null && accepting.done === false"
        class="accepting test-xs inline-flex items-center"
      >
        <span class="text-sky-600">接收</span>
        <SvgSpinners3DotsBounce class="text-purple-400  mr-1 ml-1 " />
        <p class="text-sm not-italic truncate max-w-40 ">{{ acceptingFilename }}</p>
        <em class="text-sm not-italic ml-1 mr-1 text-green-600">
          {{ acceptingDesc }}
        </em>
        <SvgSpinnersBlocksShuffle3 class="text-gray-400 inline" />
      </span>
    </section>
    <!-- 行内一条  end -->
  </div>
</template>

<style lang="scss" scoped>
.sending {
  p {
    margin: 0;
  }
}

.block-bg-gradient {
  background: linear-gradient(#eea9a9, #a1a6e2);
}
</style>

