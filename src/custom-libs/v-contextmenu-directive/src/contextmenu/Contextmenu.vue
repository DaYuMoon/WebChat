<script>
import ContextmenuContent from './ContextmenuContent.vue'

const MENU_WIDTH = 170
const MENU_HEIGHT = 30
const MENU_PADDING = 5
const DIVIDER_HEIGHT = 11
const SUB_MENU_WIDTH = 120

export default {
  name: 'VContextmenu',
  components: {
    ContextmenuContent,
  },
  props: {
    axis: {
      type: Object,
      default() {
        return { x: 0, y: 0 }
      },
    },
    el: {
      type: Object,
    },
    menus: {
      type: Array,
      default() {
        return [{ text: '' }]
      },
    },
    isDark: {
      type: Boolean,
      default: false,
    },
    removeContextMenu: {
      type: Function,
      default() {
        return () => {}
      },
    },
  },
  data() {
    return {
      status: false,
    }
  },
  computed: {
    style() {
      const { x, y } = this.axis

      const normalMenuCount = this.menus.filter(menu => !menu.divider && !menu.hide).length
      const dividerMenuCount = this.menus.filter(menu => menu.divider).length

      const menuWidth = MENU_WIDTH
      const menuHeight = normalMenuCount * MENU_HEIGHT + dividerMenuCount * DIVIDER_HEIGHT + MENU_PADDING * 2

      const maxMenuWidth = MENU_WIDTH + SUB_MENU_WIDTH - 10

      const screenWidth = document.body.clientWidth
      const screenHeight = document.body.clientHeight

      const left = (screenWidth <= x + menuWidth ? x - menuWidth : x)
      const top = (screenHeight <= y + menuHeight ? y - menuHeight : y)

      const subMenuPosition = screenWidth <= left + maxMenuWidth ? 'right' : 'left'

      return {
        left: `${left}px`,
        top: `${top}px`,
        subMenuPosition,
      }
    },
  },
  mounted() {
    this.$nextTick(() => this.status = true)
  },
  beforeUnmount() {
    document.body.removeChild(this.$el)
  },
  methods: {
    clickMenuItem(item) {
      if (item.disable || item.children)
        return

      this.status = false
      item.action && item.action(this.el)

      this.removeContextMenu()
    },
  },
}
</script>

<template>
  <div
    v-show="status"
    class="v-contextmenu"
    :style="{
      left: style.left,
      top: style.top,
    }"
    @contextmenu.prevent
  >
    <ContextmenuContent
      :menus="menus"
      :is-dark="isDark"
      :sub-menu-position="style.subMenuPosition"
      :click-menu-item="clickMenuItem"
    />
  </div>
</template>

<style lang="scss">
.v-contextmenu {
  position: fixed;
  z-index: 9999;
  user-select: none;
}
</style>
