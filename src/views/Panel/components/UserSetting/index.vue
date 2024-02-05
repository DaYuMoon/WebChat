<script lang="ts" setup>
import { Dialog as ElDialog, MessageBox } from 'element-ui'
import { computed, nextTick, reactive, toRefs, watch } from 'vue'
import { getNickname, setNickname } from '@/utils/user'
import { socketRef } from '@/hooks/socket'
import store from '@/store'

interface Props {
  visible: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})

const emit = defineEmits<{
  (evt: 'update:visible', val: Props['visible']): void
}>()

const { userInfo } = toRefs(store.state)

const isSetHintRef = useStorage<'0' | '1'>('user-setting-hint', '0')

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: Props['visible']) => emit('update:visible', val),
})

const setting = reactive({
  nickname: '', // 用户昵称
})

watch(userInfo, (val) => {
  if (val && 'nickname' in val)
    setting.nickname = val.nickname || ''
}, { immediate: true })

/**
 * 确认修改
 */
function confirm() {
  dialogVisible.value = false

  isSetHintRef.value = '1'

  updateNickname()
}

/**
 * 更新用户昵称
 */
function updateNickname() {
  if (setting.nickname) {
    setNickname(setting.nickname)

    socketRef.value?.emit('update-remote-userInfo', 'nickname', setting.nickname)
  }
}

// NOTE: 提示设置用户名 start

/**
 * 是否需要提示设置用户名
 */
const isHintSetting = computed(() => {
  const nickname = userInfo.value.nickname || getNickname()

  return !isSetHintRef.value || !nickname
})

const unwatch = watch(isHintSetting, (val) => {
  if (val) {
    MessageBox.confirm('为了方便使用, 请先设置用户名。', '系统提示', {
      confirmButtonText: '好的,现在弄',
      cancelButtonText: '别念了,等会弄',
      type: 'warning',
    }).then(() => {
      // 显示本修改用户对话框
      dialogVisible.value = true
    })

    nextTick(() => {
      unwatch()
    })
  }
}, { immediate: true })
// NOTE: 提示设置用户名  end
</script>

<template>
  <div>
    <ElDialog
      title="用户设置"
      width="500px"
      :visible.sync="dialogVisible"
      :close-on-click-modal="false"
    >
      <ElForm size="mini">
        <ElFormItem label="显示昵称">
          <el-input
            v-model="setting.nickname"
            clearable
            :placeholder="`请输入用户昵称（默认显示 IP：${userInfo.ip}）`"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="dialog-footer">
          <el-button size="medium" @click="dialogVisible = false">
            关闭
          </el-button>
          <el-button size="medium" type="primary" @click="confirm">
            确认修改
          </el-button>
        </div>
      </template>
    </ElDialog>
  </div>
</template>
