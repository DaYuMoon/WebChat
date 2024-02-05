<script>
export default {
  name: 'VContextmenuContent',
  props: {
    menus: {
      type: Array,
      required: true,
    },
    isDark: {
      type: Boolean,
      default: false,
    },
    subMenuPosition: {
      type: String,
      default: 'left',
    },
    clickMenuItem: {
      type: Function,
      required: true,
    },
  },
}
</script>

<template>
  <ul class="v-contextmenu-content" :class="[{ dark: isDark }]">
    <template v-for="(menu, index) in menus">
      <li
        v-if="!menu.hide"
        :key="menu.text || index"
        class="v-contextmenu-item"
        :class="{ divider: menu.divider, disable: menu.disable }"
        @click.stop="clickMenuItem(menu)"
      >
        <div v-if="!menu.divider" class="v-contextmenu-item-content" :class="{ 'has-sub-menu': menu.children }">
          <span class="text" v-html="menu.text" />
          <span v-if="menu.subText && !menu.children" class="sub-text">{{ menu.subText }}</span>

          <v-contextmenu-content
            v-if="menu.children && menu.children.length"
            class="sub-menu"
            :style="{
              [subMenuPosition]: '112.5%',
            }"
            :menus="menu.children"
            :click-menu-item="clickMenuItem"
          />
        </div>
      </li>
    </template>
  </ul>
</template>

<style lang="scss" scoped>
$menuWidth: 170px;
$menuHeight: 30px;
$subMenuWidth: 120px;

.v-contextmenu-content {
  width: $menuWidth;
  padding: 5px 0;
  background-color: #fff;
  box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.12);
  border-radius: 2px;
  list-style: none;
  margin: 0;

  &.dark {
    background-color: #393939;
    box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.25);

    .v-contextmenu-content {
      background-color: #393939;
      box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.25);
    }

    .v-contextmenu-item {
      color: #f1f1f1;
      background-color: #393939;

      &:hover:not(.disable) {
        background-color: #555;
      }

      &.divider {
        background-color: #888;
      }

      &.disable {
        color: #888;
      }
    }
  }
}
.v-contextmenu-item {
  padding: 0 20px;
  color: #333;
  font-size: 12px;
  transition: all 0.1s;
  white-space: nowrap;
  height: $menuHeight;
  line-height: $menuHeight;
  background-color: #fff;

  &:not(.disable):hover > .v-contextmenu-item-content > .sub-menu {
    display: block;
  }

  &:hover:not(.disable) {
    background-color: #91c9f7;
  }

  &.divider {
    height: 1px;
    overflow: hidden;
    margin: 5px;
    background-color: #e5e5e5;
    line-height: 0;
    padding: 0;
  }

  &.disable {
    color: #b1b1b1;
    cursor: no-drop;
  }
}
.v-contextmenu-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  &.has-sub-menu::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-width: 1px;
    border-style: solid;
    border-color: #666 #666 transparent transparent;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
  }
  .sub-text {
    opacity: 0.3;
  }
  .sub-menu {
    position: absolute;
    top: -5px;
    display: none;
    width: $subMenuWidth;
  }
}
</style>
