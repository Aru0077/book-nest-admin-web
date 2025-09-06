/**
 * Token 管理工具函数 - admin-web
 * 处理JWT token的存储、获取、验证和清除
 */

import { STORAGE_KEYS } from '@/constants'
import type { TokenPair } from '@/types'

/**
 * 保存token对到localStorage
 */
export const saveTokens = (tokens: TokenPair): void => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
}

/**
 * 获取访问令牌
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

/**
 * 获取刷新令牌
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
}

/**
 * 获取所有token
 */
export const getTokens = (): TokenPair | null => {
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()
  
  if (!accessToken || !refreshToken) {
    return null
  }
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 0, // 这些值在实际使用时会被刷新
    refreshExpiresIn: 0
  }
}

/**
 * 清除所有token
 */
export const clearTokens = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
}

/**
 * 检查token是否存在
 */
export const hasTokens = (): boolean => {
  return !!(getAccessToken() && getRefreshToken())
}

/**
 * 解析JWT token载荷（不验证签名，仅用于获取基本信息）
 */
export const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * 检查token是否即将过期（提前5分钟检查）
 */
export const isTokenExpiringSoon = (token: string, minutesThreshold = 5): boolean => {
  const payload = parseJwtPayload(token)
  
  if (!payload || !payload.exp) {
    return true // 如果无法解析或没有过期时间，认为需要刷新
  }
  
  const expTime = (payload.exp as number) * 1000 // 转换为毫秒
  const now = Date.now()
  const threshold = minutesThreshold * 60 * 1000 // 阈值转换为毫秒
  
  return expTime - now < threshold
}

/**
 * 获取token的过期时间
 */
export const getTokenExpirationTime = (token: string): Date | null => {
  const payload = parseJwtPayload(token)
  
  if (!payload || !payload.exp) {
    return null
  }
  
  return new Date((payload.exp as number) * 1000)
}

/**
 * 格式化Authorization header
 */
export const formatAuthHeader = (token: string): string => {
  return `Bearer ${token}`
}

/**
 * 从Authorization header中提取token
 */
export const extractTokenFromAuthHeader = (authHeader: string): string | null => {
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

/**
 * 检查是否为超级管理员token（通过解析payload中的role字段）
 */
export const isSuperAdminToken = (token: string): boolean => {
  const payload = parseJwtPayload(token)
  return payload?.role === 'SUPER_ADMIN'
}

/**
 * 获取token中的用户ID
 */
export const getUserIdFromToken = (token: string): string | null => {
  const payload = parseJwtPayload(token)
  return (payload?.sub as string) || null
}

/**
 * 获取token中的用户角色
 */
export const getRoleFromToken = (token: string): string | null => {
  const payload = parseJwtPayload(token)
  return (payload?.role as string) || null
}