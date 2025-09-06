<template>
  <div class="dashboard">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>管理员仪表板</h1>
          <div class="user-info">
            <span>欢迎，{{ authStore.userInfo?.username || authStore.userInfo?.email }}</span>
            <el-button type="text" @click="handleLogout">退出登录</el-button>
          </div>
        </div>
      </el-header>

      <el-main>
        <div class="dashboard-content">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>管理概览</span>
                  </div>
                </template>
                <div class="dashboard-stats">
                  <p>这里将显示平台统计信息</p>
                  <p>商家数量、订单统计、成交金额等</p>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" style="margin-top: 20px;" v-if="authStore.canApproveAdmins">
            <el-col :span="24">
              <el-card>
                <template #header>
                  <div class="card-header">
                    <span>待审批管理员</span>
                    <el-button type="primary" size="small" @click="fetchPendingAdmins">
                      刷新列表
                    </el-button>
                  </div>
                </template>
                <div class="pending-admins">
                  <el-empty v-if="authStore.pendingAdmins.length === 0" description="暂无待审批管理员" />
                  <el-table v-else :data="authStore.pendingAdmins" style="width: 100%">
                    <el-table-column prop="email" label="邮箱" />
                    <el-table-column prop="username" label="用户名" />
                    <el-table-column prop="appliedAt" label="申请时间" />
                    <el-table-column label="操作">
                      <template #default="scope">
                        <el-button type="primary" size="small" @click="approveAdmin(scope.row.id)">
                          通过
                        </el-button>
                        <el-button type="danger" size="small" @click="rejectAdmin(scope.row.id)">
                          拒绝
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  try {
    await authStore.logout()
    ElMessage.success('退出登录成功')
    router.push('/login')
  } catch (error) {
    ElMessage.error((error as Error).message || '退出登录失败')
  }
}

const fetchPendingAdmins = async () => {
  if (!authStore.canApproveAdmins) return

  try {
    await authStore.fetchPendingAdmins()
  } catch (error) {
    ElMessage.error((error as Error).message || '获取待审批列表失败')
  }
}

const approveAdmin = async (adminId: string) => {
  try {
    await authStore.approveAdmin(adminId)
    ElMessage.success('审批通过')
  } catch (error) {
    ElMessage.error((error as Error).message || '审批操作失败')
  }
}

const rejectAdmin = async (adminId: string) => {
  const reason = prompt('请输入拒绝理由：')
  if (!reason) return

  try {
    await authStore.rejectAdmin(adminId, reason)
    ElMessage.success('已拒绝申请')
  } catch (error) {
    ElMessage.error((error as Error).message || '拒绝操作失败')
  }
}

onMounted(() => {
  if (authStore.canApproveAdmins) {
    fetchPendingAdmins()
  }
})
</script>

<style scoped>
.dashboard {
  height: 100vh;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.el-main {
  padding: 20px;
  background-color: #f5f7fa;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-stats {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-regular);
}

.pending-admins {
  min-height: 200px;
}
</style>
