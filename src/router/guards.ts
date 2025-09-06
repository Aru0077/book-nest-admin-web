/**
 * 路由认证守卫 - admin-web
 * 处理路由级别的权限控制和认证检查，包含管理员特有功能
 */

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { hasTokens, isTokenExpiringSoon, getAccessToken, isSuperAdminToken } from '@/utils/token'

/**
 * 认证守卫 - 检查管理员是否已登录
 */
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> => {
  const authStore = useAuthStore()
  
  // 如果用户未认证，跳转到登录页
  if (!authStore.isAuthenticated) {
    // 尝试从localStorage恢复认证状态
    if (hasTokens()) {
      authStore.initAuth()
      
      // 如果恢复成功，检查token是否即将过期
      if (authStore.isAuthenticated) {
        const accessToken = getAccessToken()
        if (accessToken && isTokenExpiringSoon(accessToken)) {
          try {
            await authStore.refreshToken()
          } catch (error) {
            console.error('Token refresh failed:', error)
            // 刷新失败，跳转到登录页
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
    
    // 未认证，跳转到登录页
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
    // 已登录管理员重定向到仪表板或指定页面
    const redirectTo = (to.query.redirect as string) || '/dashboard'
    next(redirectTo)
    return
  }
  
  next()
}

/**
 * 角色守卫工厂 - 检查管理员角色权限
 */
export const createRoleGuard = (allowedRoles: string[]) => {
  return (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): void => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    const userRole = authStore.userInfo?.role
    if (!userRole || !allowedRoles.includes(userRole)) {
      // 无权限，跳转到403页面
      next({ name: 'Forbidden' })
      return
    }
    
    next()
  }
}

/**
 * 超级管理员守卫
 */
export const superAdminGuard = createRoleGuard(['SUPER_ADMIN'])

/**
 * 普通管理员守卫（包含超级管理员）
 */
export const adminGuard = createRoleGuard(['ADMIN', 'SUPER_ADMIN'])

/**
 * 管理员状态检查守卫 - 检查管理员账户状态和审批状态
 */
export const statusGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void => {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  const userStatus = authStore.userInfo?.status
  
  // 检查管理员审批状态
  if (userStatus === 'PENDING') {
    // 等待审批，跳转到等待页面
    next({ name: 'PendingApproval' })
    return
  }
  
  if (userStatus === 'REJECTED') {
    // 申请被拒绝，跳转到拒绝页面
    next({ name: 'ApplicationRejected' })
    return
  }
  
  if (userStatus === 'INACTIVE') {
    // 账户被禁用，跳转到账户状态页面
    next({ name: 'AccountInactive' })
    return
  }
  
  if (userStatus !== 'ACTIVE') {
    // 其他异常状态
    next({ name: 'AccountStatus' })
    return
  }
  
  next()
}

/**
 * 审批功能守卫 - 仅超级管理员可访问审批相关功能
 */
export const approvalGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void => {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  if (!authStore.canApproveAdmins) {
    // 非超级管理员或状态不是ACTIVE，无权限访问审批功能
    next({ name: 'Forbidden' })
    return
  }
  
  next()
}

/**
 * 组合守卫 - 同时检查认证、状态和角色
 */
export const authStatusAndRoleGuard = (allowedRoles: string[]) => {
  return async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): Promise<void> => {
    // 先检查认证
    await new Promise<void>((resolve) => {
      authGuard(to, from, (result) => {
        if (typeof result === 'undefined') {
          resolve()
        } else {
          next(result)
          return
        }
      })
    })
    
    // 再检查状态
    await new Promise<void>((resolve) => {
      statusGuard(to, from, (result) => {
        if (typeof result === 'undefined') {
          resolve()
        } else {
          next(result)
          return
        }
      })
    })
    
    // 最后检查角色
    const roleGuard = createRoleGuard(allowedRoles)
    roleGuard(to, from, next)
  }
}

/**
 * 路由元信息守卫 - 基于路由meta信息进行权限控制
 */
export const metaGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> => {
  const authStore = useAuthStore()
  
  // 检查路由是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 尝试从localStorage恢复
    if (hasTokens()) {
      authStore.initAuth()
      
      if (authStore.isAuthenticated) {
        const accessToken = getAccessToken()
        if (accessToken && isTokenExpiringSoon(accessToken)) {
          try {
            await authStore.refreshToken()
          } catch (error) {
            console.error('Token refresh failed:', error)
            next({
              name: 'Login',
              query: { redirect: to.fullPath }
            })
            return
          }
        }
      } else {
        next({
          name: 'Login',
          query: { redirect: to.fullPath }
        })
        return
      }
    } else {
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }
  
  // 检查管理员状态
  if (to.meta.requiresActive && authStore.isAuthenticated) {
    const userStatus = authStore.userInfo?.status
    if (userStatus !== 'ACTIVE') {
      if (userStatus === 'PENDING') {
        next({ name: 'PendingApproval' })
      } else if (userStatus === 'REJECTED') {
        next({ name: 'ApplicationRejected' })
      } else {
        next({ name: 'AccountInactive' })
      }
      return
    }
  }
  
  // 检查角色权限
  if (to.meta.roles && authStore.isAuthenticated) {
    const userRole = authStore.userInfo?.role
    const allowedRoles = to.meta.roles as string[]
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      next({ name: 'Forbidden' })
      return
    }
  }
  
  // 检查超级管理员权限
  if (to.meta.requiresSuperAdmin && authStore.isAuthenticated) {
    if (!authStore.isSuperAdmin) {
      next({ name: 'Forbidden' })
      return
    }
  }
  
  // 检查审批权限
  if (to.meta.requiresApproval && authStore.isAuthenticated) {
    if (!authStore.canApproveAdmins) {
      next({ name: 'Forbidden' })
      return
    }
  }
  
  next()
}

/**
 * 全局错误处理守卫
 */
export const errorGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void => {
  try {
    next()
  } catch (error) {
    console.error('Router guard error:', error)
    next({ name: 'Error' })
  }
}

// 导出守卫组合
export const guards = {
  auth: authGuard,
  guest: guestGuard,
  superAdmin: superAdminGuard,
  admin: adminGuard,
  status: statusGuard,
  approval: approvalGuard,
  meta: metaGuard,
  error: errorGuard,
  createRole: createRoleGuard,
  authStatusAndRole: authStatusAndRoleGuard
}