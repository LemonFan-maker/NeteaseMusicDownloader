<script setup>
import { ref, computed } from 'vue'
import { useMusicStore } from '@/stores/musicStore'

const store = useMusicStore()
const keyword = ref('')
const selectedLevel = ref('lossless')

const qualities = [
  { value: 'standard',  label: '标准' },
  { value: 'exhigh',    label: '极高' },
  { value: 'lossless',  label: '无损' },
  { value: 'hires',     label: 'Hi-Res' },
  { value: 'sky',       label: '沉浸' },
  { value: 'jyeffect',  label: '高清环绕' },
  { value: 'jymaster',  label: '超清母带' },
]

function formatDuration(ms) {
  if (!ms) return '--:--'
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

async function handleSearch() {
  if (keyword.value.trim()) {
    await store.search(keyword.value)
  }
}

function selectSong(song) {
  store.loadSong(String(song.id), selectedLevel.value)
}

function addToQueue(song) {
  store.addToDownloadQueue(song, selectedLevel.value)
}

const hasResults = computed(() => store.searchResults.length > 0)
</script>

<template>
  <div class="flex flex-col h-full gap-4">

    <!-- Search bar -->
    <div class="glass rounded-2xl p-4 flex flex-col gap-3">
      <div class="flex gap-2">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索歌曲名、歌手…"
          class="glow-input flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                 text-sm text-white placeholder-white/30 focus:border-violet-400/60"
          @keyup.enter="handleSearch"
        />
        <button
          @click="handleSearch"
          :disabled="store.searchLoading"
          class="glass-btn-accent rounded-xl px-5 py-2.5 text-sm font-medium text-white
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!store.searchLoading">搜索</span>
          <svg v-else class="w-4 h-4 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </button>
      </div>

      <!-- Quality selector -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs text-white/40 shrink-0">音质：</span>
        <button
          v-for="q in qualities" :key="q.value"
          @click="selectedLevel = q.value"
          :class="[
            'px-2.5 py-1 rounded-lg text-xs transition-all duration-200',
            selectedLevel === q.value
              ? 'bg-violet-500/40 border border-violet-400/50 text-violet-200'
              : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10'
          ]"
        >{{ q.label }}</button>
      </div>
    </div>

    <!-- Results panel -->
    <div class="glass rounded-2xl flex-1 flex flex-col overflow-hidden min-h-0">

      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <h2 class="text-sm font-semibold text-white/80">
          <template v-if="hasResults">
            搜索结果
            <span class="ml-2 px-2 py-0.5 bg-violet-500/30 rounded-full text-xs text-violet-300">
              {{ store.searchResults.length }}
            </span>
          </template>
          <template v-else-if="store.searchKeyword">无结果</template>
          <template v-else>搜索结果</template>
        </h2>
        <span v-if="store.searchKeyword" class="text-xs text-white/30">
          "{{ store.searchKeyword }}"
        </span>
      </div>

      <!-- Loading skeleton: 首次搜索时（无旧结果）才显示 skeleton，避免布局跳动 -->
      <div v-if="store.searchLoading && !hasResults" class="flex flex-col gap-2 p-3">
        <div v-for="i in 8" :key="i" class="flex items-center gap-3 p-2 rounded-xl">
          <div class="shimmer-bg w-10 h-10 rounded-xl shrink-0"></div>
          <div class="flex-1 flex flex-col gap-1.5">
            <div class="shimmer-bg h-3 rounded-full w-3/4"></div>
            <div class="shimmer-bg h-2.5 rounded-full w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="store.searchError && !store.searchLoading"
           class="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center">
        <div class="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center">
          <svg class="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <p class="text-sm text-red-300">{{ store.searchError }}</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="!hasResults"
           class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div class="w-16 h-16 rounded-3xl glass flex items-center justify-center animate-float">
          <svg class="w-8 h-8 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <p class="text-sm text-white/30">输入关键词开始搜索</p>
      </div>

      <!-- Song list -->
      <div v-else class="flex-1 overflow-y-auto p-2 stagger relative">
        <!-- 重新搜索时的轻量刷新遮罩，不触发布局变化 -->
        <Transition name="search-overlay">
          <div v-if="store.searchLoading"
               class="absolute inset-0 z-10 flex items-center justify-center"
               style="background: rgba(9,13,31,0.55); backdrop-filter: blur(2px); border-radius: 14px;">
            <svg class="w-7 h-7 text-violet-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        </Transition>
        <div
          v-for="(song, idx) in store.searchResults"
          :key="song.id"
          class="song-row animate-slide-up flex items-center gap-3 px-3 py-2.5 group min-w-0"
          :style="{ animationDelay: idx * 30 + 'ms' }"
        >
          <!-- Index -->
          <span class="text-xs text-white/20 tabular-nums w-5 text-right shrink-0 group-hover:hidden">
            {{ idx + 1 }}
          </span>
          <svg class="w-3.5 h-3.5 text-white/30 shrink-0 hidden group-hover:block" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <!-- Cover art -->
          <div class="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 glass ring-1 ring-white/10">
            <img
              v-if="song.picUrl || song.pic_url"
              :src="(song.picUrl || song.pic_url) + '?param=88y88'"
              :alt="song.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-5 h-5 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 19V6l12-3v13M9 19c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2zm12-3c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2z"/>
              </svg>
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0 overflow-hidden">
            <div class="overflow-hidden leading-snug">
              <p class="scroll-text text-sm font-medium text-white/90 whitespace-nowrap">{{ song.name ?? song.song_name }}</p>
            </div>
            <div class="overflow-hidden mt-0.5">
              <p class="scroll-text text-xs text-white/40 whitespace-nowrap">
                {{ song.artists ?? song.ar?.map(a => a.name).join(', ') ?? '—' }}
                <span v-if="song.album ?? song.al?.name" class="opacity-60">
                  &nbsp;·&nbsp;{{ song.album ?? song.al?.name }}
                </span>
              </p>
            </div>
          </div>

          <!-- Duration -->
          <span v-if="song.duration || song.dt" class="text-xs text-white/30 tabular-nums shrink-0 hidden sm:block">
            {{ formatDuration(song.duration ?? song.dt) }}
          </span>

          <!-- Action buttons -->
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <!-- View detail -->
            <button
              @click.stop="selectSong(song)"
              class="glass-btn rounded-xl w-8 h-8 flex items-center justify-center text-sky-300 hover:bg-sky-500/20"
              title="查看详情"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
            <!-- Download -->
            <button
              @click.stop="addToQueue(song)"
              class="glass-btn rounded-xl w-8 h-8 flex items-center justify-center text-violet-300 hover:bg-violet-500/20"
              title="加入下载队列"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.border-white\/8 { border-color: rgba(255,255,255,0.08); }

/* 文字滚动：默认截断，hover 时平滑滚动显示全文 */
.scroll-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* hover 时：text 延伸到自然宽度，父级 overflow:hidden 负责裁剪，translateX 左移露出全文 */
.song-row:hover .scroll-text {
  overflow: visible;
  text-overflow: clip;
  animation: scroll-marquee 6s ease-in-out infinite;
  animation-delay: 0.4s;
}
@keyframes scroll-marquee {
  0%,  15% { transform: translateX(0); }
  75%, 90% { transform: translateX(-60%); }
  100%     { transform: translateX(0); }
}

.search-overlay-enter-active,
.search-overlay-leave-active {
  transition: opacity 0.2s ease;
}
.search-overlay-enter-from,
.search-overlay-leave-to {
  opacity: 0;
}
</style>
