<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <h2>BookNest 管理员注册</h2>
          <p class="subtitle">注册后需等待超级管理员审批</p>
        </div>
      </template>

      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" class="register-form"
        @submit.prevent="handleRegister">
        <el-form-item prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入邮箱" size="large" :prefix-icon="Message" clearable />
        </el-form-item>

        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" size="large" :prefix-icon="User" clearable />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" size="large" :prefix-icon="Lock"
            show-password clearable />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码" size="large"
            :prefix-icon="Lock" show-password clearable @keyup.enter="handleRegister" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="authStore.isLoading"
            @click="handleRegister">
            {{ authStore.isLoading ? '注册中...' : '提交注册申请' }}
          </el-button>
        </el-form-item>

        <el-form-item>
          <div class="form-footer">
            <span>已有账号？</span>
            <el-link type="primary" @click="$router.push('/login')">
              立即登录
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
import { User, Lock, Message } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/useAuthStore'
const router = useRouter()
const authStore = useAuthStore()

const registerFormRef = ref()
const registerForm = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: Function) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20位字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    await registerFormRef.value.validate()

    const { confirmPassword, ...registerData } = registerForm
    await authStore.register(registerData)

    ElMessage.success('注册申请提交成功，请等待超级管理员审批')
    router.push('/login')
  } catch (error) {
    ElMessage.error((error as Error).message || '注册失败')
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
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

.subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.register-form {
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
