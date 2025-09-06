/**
 * 核心类型定义 - 精简版本
 * 与后端API对齐，遵循YAGNI原则
 */

// ============ API响应类型 ============
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  code: number
  message: string
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  code: number
  timestamp: string
  path: string
  method: string
  message: string
  error?: {
    name: string
    stack?: string
    [key: string]: unknown
  }
}

// ============ 用户相关类型 ============
export interface User {
  id: string
  email?: string
  phone?: string
  username?: string
  emailVerified: boolean
  phoneVerified: boolean
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface AdminUser extends Omit<User, 'status'> {
  role: 'SUPER_ADMIN' | 'ADMIN'
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED'
  appliedAt: string
  approvedBy?: string
  approvedAt?: string
  rejectedReason?: string
}

// ============ 认证相关类型 ============
export interface LoginRequest {
  identifier: string // 邮箱/手机号/用户名
  password: string
}

export interface RegisterRequest {
  email?: string
  phone?: string
  username?: string
  password: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
}

export interface LoginResponse {
  user: AdminUser
  tokens: TokenPair
}

// ============ 管理员审批相关类型 ============
export interface AdminApprovalRequest {
  adminId: string
  decision: 'approve' | 'reject'
  reason?: string
}

export interface PendingAdmin {
  id: string
  email?: string
  phone?: string
  username?: string
  appliedAt: string
  role: 'ADMIN' | 'SUPER_ADMIN'
}

export interface AdminApprovalResponse {
  id: string
  status: 'ACTIVE' | 'REJECTED'
  approvedBy: string
  approvedAt: string
  rejectedReason?: string
}

// ============ 基础工具类型 ============
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type ID = string | number