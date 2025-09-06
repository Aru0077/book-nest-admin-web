/**
 * 本地存储工具函数 - admin-web (精简版)
 * 封装localStorage操作，提供类型安全和错误处理
 */

/**
 * 安全获取localStorage数据
 */
export const safeGetStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * 安全解析JSON
 */
export const safeJsonParse = <T>(data: string): T | null => {
  try {
    return JSON.parse(data) as T
  } catch {
    return null
  }
}

/**
 * 存储数据到localStorage
 */
export const setStorage = <T>(key: string, value: T): boolean => {
  try {
    const serializedValue = JSON.stringify(value)
    localStorage.setItem(key, serializedValue)
    return true
  } catch {
    return false
  }
}

/**
 * 从localStorage获取数据
 */
export const getStorage = <T>(key: string): T | null => {
  const item = safeGetStorage(key)
  if (item === null) {
    return null
  }
  return safeJsonParse<T>(item)
}

/**
 * 从localStorage删除数据
 */
export const removeStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/**
 * 检查localStorage中是否存在某个key
 */
export const hasStorage = (key: string): boolean => {
  return safeGetStorage(key) !== null
}