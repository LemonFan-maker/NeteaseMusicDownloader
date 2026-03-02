<script setup>
import { ref, computed, watch } from 'vue'
import { useMusicStore } from '@/stores/musicStore'

const props = defineProps({
  mode: { type: String, default: 'playlist' },  // 'playlist' | 'album'
})

const store = useMusicStore()
const inputId = ref('')
const selectedLevel = ref('lossless')

const qualities = [
  { value: 'standard', label: '标准' },
  { value: 'exhigh',   label: '极高' },
  { value: 'lossless', label: '无损' },
  { value: 'hires',    label: 'Hi-Res' },
]

const isPlaylist = computed(() => props.mode === 'playlist')
const state = computed(() => isPlaylist.value ? store.playlist : store.album)

const coverImage = computed(() => {
  const d = state.value.data
  if (!d) return ''
  return d.coverImgUrl || d.picUrl || d.blurPicUrl || ''
})
const title = computed(() => {
  const d = state.value.data
  if (!d) return ''
  return d.name ?? ''
})
const description = computed(() => {
  const d = state.value.data
  if (!d) return ''
  return d.description ?? d.artists?.map(a => a.name).join(', ') ?? ''
})
const tracks = computed(() => {
  const d = state.value.data
  if (!d) return []
  // playlist stores tracks in tracks or trackIds (might need map), album in songs
  return d.tracks ?? d.songs ?? []
})

watch(() => props.mode, () => {
  inputId.value = ''
})

async function load() {
  const raw = inputId.value.trim()
  if (!raw) return
  const id = extractId(raw)
  if (isPlaylist.value) {
    await store.loadPlaylist(id)
  } else {
    await store.loadAlbum(id)
  }
}

function selectSong(song) {
  const id = song.id ?? song.songId
  if (id) store.loadSong(String(id), selectedLevel.value)
}

function addToQueue(song) {
  store.addToDownloadQueue(song, selectedLevel.value)
}

function extractId(input) {
  // Support pasting full URL or raw ID
  const m = input.match(/[?&]id=(\d+)/) || input.match(/\/(\d+)(?:\?|$)/)
  return m ? m[1] : input.replace(/\D/g, '') || input
}

function formatDuration(ms) {
  if (!ms) return '--:--'
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
</script>

<template>
  <div class="flex flex-col h-full gap-4">

    <!-- Input bar -->
    <div class="glass rounded-2xl p-4 flex flex-col gap-3">
      <div class="flex gap-2">
        <input
          v-model="inputId"
          type="text"
          :placeholder="isPlaylist ? '输入歌单 ID 或链接…' : '输入专辑 ID 或链接…'"
          class="glow-input flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                 text-sm text-white placeholder-white/30 focus:border-violet-400/60"
          @keyup.enter="load"
        />
        <button
          @click="load"
          :disabled="state.loading"
          class="glass-btn-accent rounded-xl px-5 py-2.5 text-sm font-medium text-white
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!state.loading">解析</span>
          <svg v-else class="w-4 h-4 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </button>
      </div>

      <!-- Quality selector -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-white/40 shrink-0">音质：</span>
        <button v-for="q in qualities" :key="q.value"
                @click="selectedLevel = q.value"
                :class="['px-2.5 py-1 rounded-lg text-xs transition-all',
                         selectedLevel === q.value
                           ? 'bg-violet-500/40 border border-violet-400/50 text-violet-200'
                           : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80']">
          {{ q.label }}
        </button>
      </div>
    </div>

    <!-- Content panel -->
    <div class="glass rounded-2xl flex-1 flex flex-col overflow-hidden min-h-0">

      <!-- Loading -->
      <div v-if="state.loading"
           class="flex-1 flex flex-col gap-2 p-3">
        <div v-for="i in 8" :key="i" class="flex items-center gap-3 p-2 rounded-xl">
          <div class="shimmer-bg w-10 h-10 rounded-xl shrink-0"></div>
          <div class="flex-1 flex flex-col gap-1.5">
            <div class="shimmer-bg h-3 rounded-full w-3/4"></div>
            <div class="shimmer-bg h-2.5 rounded-full w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="state.error"
           class="flex-1 flex items-center justify-center p-8 text-center">
        <p class="text-sm text-red-300">{{ state.error }}</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="!state.data"
           class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div class="w-16 h-16 rounded-3xl glass flex items-center justify-center animate-float">
          <svg class="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path v-if="isPlaylist"
              d="M4 6h16M4 10h16M4 14h10M4 18h7"/>
            <path v-else
              d="M9 19V6l12-3v13M9 19c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2zm12-3c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2z"/>
          </svg>
        </div>
        <p class="text-sm text-white/30">粘贴 {{ isPlaylist ? '歌单' : '专辑' }} ID 后点击解析</p>
      </div>

      <!-- Data: header + track list -->
      <template v-else>
        <!-- Cover + meta -->
        <div class="relative overflow-hidden rounded-t-2xl shrink-0"
             :style="coverImage ? `background-image:url('${coverImage}?param=300y300');background-size:cover;background-position:center;` : 'background:#1a1a2e;'">
          <div class="absolute inset-0" style="backdrop-filter:blur(40px) brightness(0.35); -webkit-backdrop-filter:blur(40px) brightness(0.35);"></div>
          <div class="relative flex gap-4 p-4 items-end">
            <img v-if="coverImage"
                 :src="coverImage + '?param=160y160'" :alt="title"
                 class="w-16 h-16 rounded-xl shadow-2xl ring-2 ring-white/10 object-cover shrink-0" />
            <div v-else class="w-16 h-16 rounded-xl glass flex items-center justify-center shrink-0">
              <svg class="w-7 h-7 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 10h16M4 14h10M4 18h7"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-bold text-white leading-snug line-clamp-2">{{ title }}</h3>
              <p v-if="description" class="text-xs text-white/50 truncate mt-0.5 line-clamp-2">{{ description }}</p>
              <p class="text-xs text-white/30 mt-1">{{ tracks.length }} 首</p>
            </div>
            <!-- Batch add all to queue -->
            <button
              @click="tracks.forEach(t => addToQueue(t))"
              class="glass-btn-accent rounded-xl px-3 py-1.5 text-xs text-white flex items-center gap-1.5 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              全部加队列
            </button>
          </div>
        </div>

        <!-- Track list -->
        <div class="flex-1 overflow-y-auto p-2 stagger">
          <div
            v-for="(song, idx) in tracks"
            :key="song.id ?? idx"
            class="song-row animate-slide-up flex items-center gap-3 px-3 py-2.5 group"
            :style="{ animationDelay: idx * 25 + 'ms' }"
          >
            <span class="text-xs text-white/25 tabular-nums w-6 text-right shrink-0">{{ idx + 1 }}</span>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white/90 truncate leading-snug">{{ song.name }}</p>
              <p class="text-xs text-white/40 truncate mt-0.5">
                {{ song.ar?.map(a => a.name).join(', ') ?? song.artists ?? '—' }}
              </p>
            </div>

            <span v-if="song.dt" class="text-xs text-white/30 tabular-nums shrink-0 hidden sm:block">
              {{ formatDuration(song.dt) }}
            </span>

            <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button @click.stop="selectSong(song)"
                      class="glass-btn rounded-lg w-8 h-8 flex items-center justify-center text-blue-300"
                      title="查看详情">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
              <button @click.stop="addToQueue(song)"
                      class="glass-btn rounded-lg w-8 h-8 flex items-center justify-center text-violet-300"
                      title="加入下载队列">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
