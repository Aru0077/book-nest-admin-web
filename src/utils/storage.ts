/**
 * 本地存储工具函数 - admin-web
 * 封装localStorage操作，提供类型安全和错误处理
 */

/**
 * 存储数据到localStorage
 */
export const setStorage = <T>(key: string, value: T): boolean => {
  try {
    const serializedValue = JSON.stringify(value)
    localStorage.setItem(key, serializedValue)
    return true
  } catch (error) {
    console.error(`Failed to set localStorage item "${key}":`, error)
    return false
  }
}

/**
 * 从localStorage获取数据
 */
export const getStorage = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return null
    }
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Failed to get localStorage item "${key}":`, error)
    return null
  }
}

/**
 * 从localStorage删除数据
 */
export const removeStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Failed to remove localStorage item "${key}":`, error)
    return false
  }
}

/**
 * 检查localStorage中是否存在某个key
 */
export const hasStorage = (key: string): boolean => {
  return localStorage.getItem(key) !== null
}

/**
 * 清除所有localStorage数据
 */
export const clearStorage = (): boolean => {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
    return false
  }
}

/**
 * 获取localStorage的存储大小（近似值，以KB为单位）
 */
export const getStorageSize = (): number => {
  let total = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }
  return Math.round(total / 1024) // 转换为KB
}

/**
 * 检查localStorage是否可用
 */
export const isStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__'
    const testValue = 'test'
    localStorage.setItem(testKey, testValue)
    const retrieved = localStorage.getItem(testKey)
    localStorage.removeItem(testKey)
    return retrieved === testValue
  } catch (error) {
    return false
  }
}

/**
 * 安全的localStorage操作类
 */
export class SafeStorage {
  /**
   * 存储用户信息
   */
  static setUser<T>(key: string, user: T): boolean {
    if (!user) {
      console.warn('Attempting to store null/undefined user')
      return false
    }
    return setStorage(key, user)
  }

  /**
   * 获取用户信息
   */
  static getUser<T>(key: string): T | null {
    return getStorage<T>(key)
  }

  /**
   * 存储配置信息
   */
  static setConfig<T>(key: string, config: T): boolean {
    return setStorage(key, {
      ...config,
      timestamp: Date.now() // 添加时间戳
    })
  }

  /**
   * 获取配置信息（可检查过期时间）
   */
  static getConfig<T>(key: string, maxAge?: number): T | null {
    const data = getStorage<T & { timestamp?: number }>(key)
    
    if (!data) {
      return null
    }

    // 检查是否过期
    if (maxAge && data.timestamp) {
      const age = Date.now() - data.timestamp
      if (age > maxAge) {
        removeStorage(key)
        return null
      }
    }

    // 移除时间戳字段
    if (data.timestamp) {
      delete data.timestamp
    }

    return data as T
  }

  /**
   * 批量操作
   */
  static setBatch(items: Record<string, unknown>): boolean {
    try {
      Object.entries(items).forEach(([key, value]) => {
        setStorage(key, value)
      })
      return true
    } catch (error) {
      console.error('Failed to set batch storage:', error)
      return false
    }
  }

  static removeBatch(keys: string[]): boolean {
    try {
      keys.forEach(key => removeStorage(key))
      return true
    } catch (error) {
      console.error('Failed to remove batch storage:', error)
      return false
    }
  }

  /**
   * 存储审批历史记录（管理员特有功能）
   */
  static setApprovalHistory<T>(approvals: T[]): boolean {
    const key = 'admin_approval_history'
    return setStorage(key, {
      approvals,
      timestamp: Date.now()
    })
  }

  /**
   * 获取审批历史记录
   */
  static getApprovalHistory<T>(): T[] {
    const key = 'admin_approval_history'
    const data = getStorage<{ approvals: T[]; timestamp: number }>(key)
    return data?.approvals || []
  }

  /**
   * 存储管理员偏好设置
   */
  static setAdminPreferences<T>(preferences: T): boolean {
    return setStorage('admin_preferences', preferences)
  }

  /**
   * 获取管理员偏好设置
   */
  static getAdminPreferences<T>(): T | null {
    return getStorage<T>('admin_preferences')
  }
}