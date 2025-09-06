/**
 * HTTP 客户端配置 - admin-web
 * 基于 Axios，配置请求/响应拦截器和token管理
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, ApiErrorResponse } from '@/types'
import { STORAGE_KEYS } from '@/constants'

// 创建axios实例
const httpClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 自动添加Authorization header
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// 响应拦截器 - 处理token刷新和错误
httpClient.interceptors.response.use(
  // 成功响应直接返回
  (response) => response,
  
  // 错误响应处理
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    // 401错误：尝试刷新token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }
        
        // 调用refresh接口
        const refreshResponse = await axios.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>(
          '/api/v1/admin/auth/refresh',
          { refreshToken },
          { baseURL: 'http://localhost:3000' }
        )
        
        const { tokens } = refreshResponse.data.data
        
        // 更新本地存储的token
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
        
        // 重新设置请求头
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`
        
        // 重试原始请求
        return httpClient(originalRequest)
      } catch (refreshError) {
        // 刷新token失败，清除本地数据，跳转登录页
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_INFO)
        
        // 跳转到登录页 (这里可以使用router进行导航)
        window.location.href = '/login'
        
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

// HTTP 客户端类型安全包装器
export class HttpClient {
  /**
   * GET 请求
   */
  static async get<T = unknown>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await httpClient.get<ApiResponse<T>>(url, config)
    return response.data
  }

  /**
   * POST 请求
   */
  static async post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: InternalAxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await httpClient.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * PUT 请求
   */
  static async put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: InternalAxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await httpClient.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  /**
   * DELETE 请求
   */
  static async delete<T = unknown>(url: string, config?: InternalAxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await httpClient.delete<ApiResponse<T>>(url, config)
    return response.data
  }
}

// 错误处理工具函数
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiErrorResponse
    return apiError?.message || error.message || '网络请求失败'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return '未知错误'
}

export default httpClient