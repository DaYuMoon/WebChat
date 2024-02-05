/*
 * @Description: 注册 element 全局组件
 * @Date: 2022-08-06 00:37:55
 * @LastEditTime: 2024-01-11 12:19:42
 */
import Vue from 'vue'
import { Avatar, Button, Form, FormItem, Icon, Input } from 'element-ui'

Vue.use(Button).use(Input).use(Icon).use(Avatar).use(Form).use(FormItem)
