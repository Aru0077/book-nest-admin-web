/**
 * 路由认证守卫 - admin-web (精简版)
 * 处理路由级别的权限控制和认证检查
 */

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { hasTokens, isTokenExpiringSoon, getAccessToken } from '@/utils/token'

/**
 * 认证守卫 - 检查管理员是否已登录
 */
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    if (hasTokens()) {
      authStore.initAuth()

      if (authStore.isAuthenticated) {
        const accessToken = getAccessToken()
        if (accessToken && isTokenExpiringSoon(accessToken)) {
          try {
            await authStore.refreshToken()
          } catch {
            next({
              name: 'Login',
              query: { redirect: to.fullPath }
            })
            return
          }
        }
        next()
        return
      }
    }

    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }

  next()
}

/**
 * 游客守卫 - 已登录管理员不能访问登录/注册页面
 */
export const guestGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void => {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    const redirectTo = (to.query.redirect as string) || '/dashboard'
    next(redirectTo)
    return
  }

  next()
}
