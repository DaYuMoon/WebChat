/*
 * @Description:
 * @Date: 2022-07-26 01:43:10
 * @LastEditTime: 2024-01-11 10:26:27
 */
module.exports = {
  extends: '@antfu',
  env: {
    node: true,
  },
  rules: {
    'no-console': 'off',
    'prefer-rest-params': 'warn',
    'vue/no-deprecated-v-bind-sync': 'off',
    'vue/no-deprecated-v-on-native-modifier': 'off',
    'no-void': 'off',
  },
}
