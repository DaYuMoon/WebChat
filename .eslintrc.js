/*
 * @Description:
 * @Date: 2022-07-26 01:43:10
 * @LastEditTime: 2024-02-05 11:12:46
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
    '@typescript-eslint/prefer-ts-expect-error': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'vue/custom-event-name-casing': 'off',
  },
}
