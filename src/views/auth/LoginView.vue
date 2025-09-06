<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>BookNest 管理员登录</h2>
        </div>
      </template>

      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form"
        @submit.prevent="handleLogin">
        <el-form-item prop="identifier">
          <el-input v-model="loginForm.identifier" placeholder="请输入邮箱/手机号/用户名" size="large" :prefix-icon="User"
            clearable />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large" :prefix-icon="Lock"
            show-password clearable @keyup.enter="handleLogin" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="authStore.isLoading"
            @click="handleLogin">
            {{ authStore.isLoading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <el-form-item>
          <div class="form-footer">
            <span>还没有账号？</span>
            <el-link type="primary" @click="$router.push('/register')">
              立即注册
            </el-link>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/useAuthStore'
const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref()
const loginForm = reactive({
  identifier: '',
  password: ''
})

const loginRules = {
  identifier: [
    { required: true, message: '请输入邮箱/手机号/用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    await authStore.login(loginForm)

    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    ElMessage.error((error as Error).message || '登录失败')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.login-form {
  padding: 0 20px 20px;
}

.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: 100%;
  font-size: 14px;
  color: var(--el-text-color-regular);
}
</style>
