<script setup>
import { computed } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import { getDownloadFileUrl } from '@/api'

const store = useMusicStore()
const queue = computed(() => store.downloadQueue)

const activeCount = computed(() =>
  queue.value.filter(d => d.status === 'downloading' || d.status === 'pending').length
)

const statusConfig = {
  pending:     { label: '等待中',   color: 'text-white/40',    bg: 'bg-white/5',        icon: 'clock' },
  downloading: { label: '下载中',   color: 'text-blue-300',    bg: 'bg-blue-500/10',    icon: 'arrow-down' },
  done:        { label: '已完成',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: 'check' },
  error:       { label: '失败',     color: 'text-red-400',     bg: 'bg-red-500/10',     icon: 'x' },
}
</script>

<template>
  <div class="glass rounded-2xl flex flex-col w-full overflow-hidden min-h-0 self-start">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-semibold text-white/80">下载队列</h2>
        <span v-if="activeCount > 0"
              class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/25">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          <span class="text-xs text-blue-300">{{ activeCount }} 进行中</span>
        </span>
      </div>
      <button v-if="queue.length > 0"
              @click="store.clearFinishedQueue()"
              class="text-xs text-white/30 hover:text-white/60 transition-colors">
        清除已完成
      </button>
    </div>

    <!-- Empty -->
    <div v-if="!queue.length"
         class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div class="w-16 h-16 rounded-3xl glass flex items-center justify-center animate-float">
        <svg class="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
      </div>
      <p class="text-sm text-white/30">暂无下载任务</p>
      <p class="text-xs text-white/20">在搜索结果中点击 ↓ 按钮添加</p>
    </div>

    <!-- Queue list -->
    <div v-else class="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
      <TransitionGroup name="queue-item" tag="div" class="flex flex-col gap-2">
        <div
          v-for="(item, idx) in queue" :key="`${item.id}-${item.quality}`"
          :class="['rounded-xl p-3 transition-all duration-300', statusConfig[item.status]?.bg ?? 'bg-white/5',
                   'border border-white/8']"
        >
          <div class="flex items-start gap-3">
            <!-- Status icon -->
            <div :class="['w-8 h-8 rounded-xl glass flex items-center justify-center shrink-0 mt-0.5',
                          statusConfig[item.status]?.color]">
              <!-- Clock -->
              <svg v-if="item.status === 'pending'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <!-- Spinner -->
              <svg v-else-if="item.status === 'downloading'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <!-- Check -->
              <svg v-else-if="item.status === 'done'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M5 13l4 4L19 7"/>
              </svg>
              <!-- X -->
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white/90 truncate leading-snug">{{ item.name }}</p>
              <p class="text-xs text-white/40 truncate">
                {{ item.artist || '—' }}
                <span class="ml-1 opacity-60">· {{ item.quality }}</span>
              </p>

              <!-- Progress bar for downloading -->
              <div v-if="item.status === 'downloading'" class="mt-2">
                <div class="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div class="progress-bar-inner h-full" :style="{ width: item.progress + '%' }"></div>
                </div>
                <div class="flex justify-between mt-0.5">
                  <span class="text-[10px] text-blue-300/70">{{ item.message }}</span>
                  <span class="text-[10px] text-white/30 tabular-nums">{{ Math.round(item.progress) }}%</span>
                </div>
              </div>

              <!-- Status text -->
              <p v-else class="text-xs mt-1" :class="statusConfig[item.status]?.color">
                {{ item.message }}
              </p>

              <!-- Done: show download link -->
              <div v-if="item.status === 'done' && item.result" class="mt-2 flex items-center gap-2">
                <a :href="getDownloadFileUrl(item.id, item.quality)"
                   target="_blank"
                   class="glass-btn rounded-lg px-3 py-1 text-xs text-violet-300 flex items-center gap-1.5">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  下载文件
                </a>
                <span v-if="item.result.file_size_formatted" class="text-[10px] text-white/30">
                  {{ item.result.file_size_formatted }}
                </span>
              </div>
            </div>

            <!-- Remove button -->
            <button @click="store.removeFromQueue(idx)"
                    class="w-6 h-6 rounded-lg glass-btn flex items-center justify-center text-white/30
                           hover:text-red-400 transition-colors shrink-0">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.queue-item-enter-active {
  transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
}
.queue-item-leave-active {
  transition: all 0.25s ease;
}
.queue-item-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.queue-item-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}
.queue-item-move {
  transition: transform 0.3s ease;
}
.border-white\/8 { border-color: rgba(255,255,255,0.08); }
</style>
