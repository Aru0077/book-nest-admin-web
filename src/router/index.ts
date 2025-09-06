import { createRouter, createWebHistory } from 'vue-router'
import { authGuard, guestGuard } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
      beforeEnter: guestGuard,
      meta: { title: '管理员登录' }
    },
    {
      path: '/register',
      name: 'Register', 
      component: () => import('@/views/auth/RegisterView.vue'),
      beforeEnter: guestGuard,
      meta: { title: '管理员注册' }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/admin/DashboardView.vue'),
      beforeEnter: authGuard,
      meta: { title: '管理仪表板', requiresAuth: true }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: '/dashboard'
    }
  ],
})

// 全局导航守卫 - 设置页面标题
router.beforeEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - BookNest 管理端`
  }
})

export default router
