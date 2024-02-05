/*
 * @Description:
 * @Date: 2023-03-02 16:26:09
 * @LastEditTime: 2023-03-02 17:23:48
 */
export default {
  theme: {
    // ...
  },
  plugins: [
    // 其他插件
    require('@windicss/plugin-animations')({
      settings: {
        animatedSpeed: 500,
        heartBeatSpeed: 1000,
        hingeSpeed: 2000,
        bounceInSpeed: 750,
        bounceOutSpeed: 750,
        animationDelaySpeed: 500,
      },
    }),
  ],
}
