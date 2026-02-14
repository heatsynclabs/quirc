import { createRouter, createWebHistory } from 'vue-router'

const ChannelView = {
  template: '<div />',
}

const routes = [
  {
    path: '/',
    name: 'home',
    component: ChannelView,
  },
  {
    path: '/channel/:name',
    name: 'channel',
    component: ChannelView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
