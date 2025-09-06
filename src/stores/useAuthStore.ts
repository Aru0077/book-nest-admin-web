/**
 * 认证Store - admin-web
 * 使用 Pinia Composition API 管理管理员用户认证状态
 * 包含管理员审批功能
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { HttpClient, handleApiError } from '@/services/http'
import { API_ENDPOINTS, STORAGE_KEYS } from '@/constants'
import type { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  AdminUser, 
  TokenPair,
  PendingAdmin,
  AdminApprovalRequest,
  AdminApprovalResponse
} from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AdminUser | null>(null)
  const tokens = ref<TokenPair | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pendingAdmins = ref<PendingAdmin[]>([])

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!tokens.value)
  const userInfo = computed(() => user.value)
  const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN')
  const isActiveAdmin = computed(() => user.value?.status === 'ACTIVE')
  const canApproveAdmins = computed(() => isSuperAdmin.value && isActiveAdmin.value)

  // Actions

  /**
   * 初始化认证状态 - 从localStorage恢复
   */
  const initAuth = (): void => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO)
      const storedAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

      if (storedUser && storedAccessToken && storedRefreshToken) {
        user.value = JSON.parse(storedUser)
        tokens.value = {
          accessToken: storedAccessToken,
          refreshToken: storedRefreshToken,
          expiresIn: 0, // 这些值在实际使用时会被刷新
          refreshExpiresIn: 0
        }
      }
    } catch (error) {
      console.error('Failed to restore auth state:', error)
      clearAuthData()
    }
  }

  /**
   * 管理员登录
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await HttpClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      )

      const { user: userData, tokens: tokenData } = response.data

      // 保存到state
      user.value = userData
      tokens.value = tokenData

      // 持久化到localStorage
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userData))
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken)

    } catch (err) {
      error.value = handleApiError(err)
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 管理员注册（需要等待审批）
   */
  const register = async (data: RegisterRequest): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      // 管理员注册只返回注册成功信息，不返回token
      await HttpClient.post(API_ENDPOINTS.AUTH.REGISTER, data)
      
      // 注册成功，但需要等待审批，不设置认证状态
    } catch (err) {
      error.value = handleApiError(err)
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 刷新访问令牌
   */
  const refreshToken = async (): Promise<void> => {
    if (!tokens.value?.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await HttpClient.post<{ tokens: TokenPair }>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refreshToken: tokens.value.refreshToken }
      )

      const newTokens = response.data.tokens

      // 更新state和localStorage
      tokens.value = newTokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newTokens.accessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newTokens.refreshToken)

    } catch (err) {
      error.value = handleApiError(err)
      // 刷新失败，清除认证数据
      clearAuthData()
      throw new Error(error.value)
    }
  }

  /**
   * 管理员注销
   */
  const logout = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      // 调用后端注销接口
      if (tokens.value?.refreshToken) {
        await HttpClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
          refreshToken: tokens.value.refreshToken
        })
      }
    } catch (err) {
      // 注销接口失败不影响本地清理
      console.warn('Logout API failed:', handleApiError(err))
    } finally {
      // 无论接口是否成功，都清理本地数据
      clearAuthData()
      isLoading.value = false
    }
  }

  /**
   * 获取待审批管理员列表（仅超级管理员可用）
   */
  const fetchPendingAdmins = async (): Promise<void> => {
    if (!canApproveAdmins.value) {
      throw new Error('Only super admin can access pending admins')
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await HttpClient.get<PendingAdmin[]>(
        API_ENDPOINTS.AUTH.PENDING
      )
      pendingAdmins.value = response.data
    } catch (err) {
      error.value = handleApiError(err)
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 审批管理员申请（仅超级管理员可用）
   */
  const approveAdmin = async (adminId: string, reason?: string): Promise<AdminApprovalResponse> => {
    if (!canApproveAdmins.value) {
      throw new Error('Only super admin can approve admins')
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await HttpClient.post<AdminApprovalResponse>(
        `${API_ENDPOINTS.AUTH.APPROVE}/${adminId}`,
        { reason }
      )

      // 从待审批列表中移除该管理员
      pendingAdmins.value = pendingAdmins.value.filter(admin => admin.id !== adminId)

      return response.data
    } catch (err) {
      error.value = handleApiError(err)
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 拒绝管理员申请（仅超级管理员可用）
   */
  const rejectAdmin = async (adminId: string, reason: string): Promise<AdminApprovalResponse> => {
    if (!canApproveAdmins.value) {
      throw new Error('Only super admin can reject admins')
    }

    if (!reason.trim()) {
      throw new Error('Rejection reason is required')
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await HttpClient.put<AdminApprovalResponse>(
        `${API_ENDPOINTS.AUTH.REJECT}/${adminId}`,
        { reason }
      )

      // 从待审批列表中移除该管理员
      pendingAdmins.value = pendingAdmins.value.filter(admin => admin.id !== adminId)

      return response.data
    } catch (err) {
      error.value = handleApiError(err)
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清除认证数据
   */
  const clearAuthData = (): void => {
    user.value = null
    tokens.value = null
    error.value = null
    pendingAdmins.value = []
    
    // 清理localStorage
    localStorage.removeItem(STORAGE_KEYS.USER_INFO)
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  }

  /**
   * 清除错误信息
   */
  const clearError = (): void => {
    error.value = null
  }

  /**
   * 更新用户信息
   */
  const updateUser = (userData: Partial<AdminUser>): void => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user.value))
    }
  }

  // 返回store的状态和方法
  return {
    // State
    user: readonly(user),
    tokens: readonly(tokens),
    isLoading: readonly(isLoading),
    error: readonly(error),
    pendingAdmins: readonly(pendingAdmins),

    // Getters
    isAuthenticated,
    userInfo,
    isSuperAdmin,
    isActiveAdmin,
    canApproveAdmins,

    // Actions
    initAuth,
    login,
    register,
    refreshToken,
    logout,
    fetchPendingAdmins,
    approveAdmin,
    rejectAdmin,
    clearAuthData,
    clearError,
    updateUser
  }
})

// 类型导出
export type AuthStore = ReturnType<typeof useAuthStore>