/**
 * HTTP服务 - admin-web (精简版)
 * 基础axios封装，遵循YAGNI原则
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/types'
import { getAccessToken } from '@/utils/token'

// 创建axios实例
export const http: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证token
http.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理错误
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const errorData = error.response?.data || {
      code: error.response?.status || 500,
      message: error.message || 'Network Error'
    }

    return Promise.reject(errorData)
  }
)

export default http