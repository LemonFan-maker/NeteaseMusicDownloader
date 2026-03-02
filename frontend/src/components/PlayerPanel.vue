<script setup>
import { ref, computed, watch } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import { getDownloadFileUrl } from '@/api'

const store = useMusicStore()
const song = computed(() => store.currentSong)

// Audio player state
const audio = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.8)
const showLyric = ref(false)
const lyricLines = computed(() => parseLyric(song.value?.lyric ?? ''))
const translatedLines = computed(() => parseLyric(song.value?.tlyric ?? ''))

const selectedLevel = ref('lossless')
const qualities = [
  { value: 'standard', label: '标准' },
  { value: 'exhigh',   label: '极高' },
  { value: 'lossless', label: '无损' },
  { value: 'hires',    label: 'Hi-Res' },
  { value: 'sky',      label: '沉浸' },
  { value: 'jyeffect', label: '高清环绕' },
  { value: 'jymaster', label: '超清母带' },
]

// Prev / Next via search results
const currentIdx = computed(() => {
  if (!song.value || !store.searchResults.length) return -1
  return store.searchResults.findIndex(s => String(s.id) === String(song.value.id))
})
const hasPrev = computed(() => currentIdx.value > 0)
const hasNext = computed(() => currentIdx.value >= 0 && currentIdx.value < store.searchResults.length - 1)

function playPrev() {
  if (!hasPrev.value) return
  const s = store.searchResults[currentIdx.value - 1]
  store.loadSong(String(s.id), selectedLevel.value)
}
function playNext() {
  if (!hasNext.value) return
  const s = store.searchResults[currentIdx.value + 1]
  store.loadSong(String(s.id), selectedLevel.value)
}

// When song changes, sync selectedLevel to actual song level
watch(() => song.value, (newSong) => {
  if (newSong?.level) {
    selectedLevel.value = newSong.level
  }
})

watch(() => lyricLines.value.length, (len) => {
  if (len > 0) showLyric.value = true
  else showLyric.value = false
})

// When song changes, auto-play
watch(() => song.value?.url, (url) => {
  if (!url) return
  isPlaying.value = false
  currentTime.value = 0
  if (audio.value) {
    audio.value.src = url
    audio.value.load()
  }
})

function togglePlay() {
  if (!audio.value || !song.value?.url) return
  if (isPlaying.value) {
    audio.value.pause()
    isPlaying.value = false
  } else {
    audio.value.play().then(() => { isPlaying.value = true }).catch(() => {})
  }
}

function onTimeUpdate() {
  if (audio.value) currentTime.value = audio.value.currentTime
}
function onLoadedMetadata() {
  if (audio.value) duration.value = audio.value.duration
}
function onEnded() {
  isPlaying.value = false
  if (hasNext.value) playNext()
}

function seek(e) {
  if (!audio.value || !duration.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  audio.value.currentTime = ratio * duration.value
}

function setVolume(e) {
  volume.value = Number(e.target.value)
  if (audio.value) audio.value.volume = volume.value
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function progressPercent() {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
}

function reloadWithQuality() {
  if (song.value?.id) {
    store.loadSong(String(song.value.id), selectedLevel.value)
  }
}

function addToQueue() {
  if (song.value) {
    store.addToDownloadQueue(song.value, selectedLevel.value)
  }
}

function parseLyric(lrc) {
  if (!lrc) return []
  const lines = []
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g
  let m
  while ((m = regex.exec(lrc)) !== null) {
    const time = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3]) / 1000
    const text = m[4].trim()
    if (text) lines.push({ time, text })
  }
  return lines.sort((a, b) => a.time - b.time)
}

const activeLyricIdx = computed(() => {
  if (!lyricLines.value.length) return -1
  let idx = 0
  for (let i = 0; i < lyricLines.value.length; i++) {
    if (lyricLines.value[i].time <= currentTime.value) idx = i
    else break
  }
  return idx
})

function getTranslation(lyricTime) {
  if (!translatedLines.value.length) return ''
  let best = null
  let bestDiff = Infinity
  for (const line of translatedLines.value) {
    const diff = Math.abs(line.time - lyricTime)
    if (diff < bestDiff) { bestDiff = diff; best = line }
  }
  return bestDiff <= 1.5 && best?.text ? best.text : ''
}

const visibleLyrics = computed(() => {
  const idx = activeLyricIdx.value
  const lines = lyricLines.value
  if (!lines.length) return []
  return [
    idx > 0 ? lines[idx - 1] : null,
    idx >= 0 ? lines[idx] : null,
    idx < lines.length - 1 ? lines[idx + 1] : null,
  ]
})
</script>

<template>
  <div class="glass rounded-2xl flex flex-col w-full overflow-hidden min-h-0 relative self-start">

    <!-- ── Empty state ── -->
    <div v-if="!song && !store.songLoading"
         class="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
      <div class="w-24 h-24 rounded-full glass flex items-center justify-center animate-float"
           style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);">
        <svg class="w-12 h-12 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
          <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
        </svg>
      </div>
      <p class="text-sm text-white/30">在左侧点击 ✓ 加载歌曲</p>
    </div>

    <!-- ── Loading ── -->
    <div v-else-if="store.songLoading"
         class="flex-1 flex flex-col items-center justify-center gap-3">
      <svg class="w-8 h-8 text-violet-400 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p class="text-sm text-white/35">加载中…</p>
    </div>

    <!-- ── Error ── -->
    <div v-else-if="store.songError"
         class="flex-1 flex items-center justify-center p-6 text-center">
      <p class="text-sm text-red-300">{{ store.songError }}</p>
    </div>

    <!-- ── Player ── -->
    <template v-else-if="song">

      <!-- Blurred background -->
      <div class="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" style="z-index:0;">
        <img v-if="song.pic" :src="song.pic + '?param=400y400'" :alt="song.name"
             class="w-full h-full object-cover scale-110"
             style="filter:blur(64px) brightness(0.22) saturate(1.8);" />
        <div class="absolute inset-0"
             style="background: linear-gradient(to bottom, rgba(9,13,31,0.45) 0%, rgba(9,13,31,0.88) 100%);"></div>
      </div>

      <div class="relative flex flex-col min-h-0" style="z-index:1;">

        <!-- ── Image ── -->
        <div class="flex flex-col items-center pt-6 pb-4 px-6">
          <div class="relative mb-4">
            <div :class="[
                   'relative w-44 h-44 rounded-full overflow-hidden shadow-2xl cover-spin',
                   isPlaying ? 'playing' : ''
                 ]"
                 style="box-shadow: 0 10px 56px rgba(0,0,0,0.75), 0 0 0 3px rgba(255,255,255,0.07), 0 0 0 9px rgba(255,255,255,0.025);">
              <img v-if="song.pic" :src="song.pic + '?param=400y400'" :alt="song.name"
                   class="w-full h-full object-cover" />
              <div v-else class="w-full h-full bg-white/5 flex items-center justify-center">
                <svg class="w-16 h-16 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 19V6l12-3v13M9 19c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2zm12-3c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2z"/>
                </svg>
              </div>
              <div class="absolute inset-0 rounded-full pointer-events-none"
                   style="background: radial-gradient(circle, transparent 18%, rgba(0,0,0,0.22) 19%, transparent 33%, rgba(0,0,0,0.14) 34%, transparent 47%, rgba(0,0,0,0.1) 48%, transparent 100%);"></div>
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-3 h-3 rounded-full bg-white/70 shadow-sm"></div>
              </div>
            </div>
            <Transition name="fade">
              <div v-if="isPlaying"
                   class="absolute inset-0 rounded-full pointer-events-none animate-glow-pulse"
                   style="box-shadow: 0 0 0 5px rgba(167,139,250,0.2), 0 0 50px rgba(167,139,250,0.4);">
              </div>
            </Transition>
          </div>

          <h2 class="text-lg font-bold text-white text-center leading-snug line-clamp-1 w-full px-2">{{ song.name }}</h2>
          <p class="text-sm text-white/55 text-center mt-1 truncate w-full">{{ song.ar_name }}</p>
          <p class="text-xs text-white/30 text-center mt-0.5 truncate w-full">{{ song.al_name }}</p>

          <div class="flex items-center gap-2 mt-3 flex-wrap justify-center">
            <span v-if="song.level"
                  class="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/30 border border-violet-400/35 text-violet-200 font-medium uppercase tracking-wider">
              {{ song.level }}
            </span>
            <span v-if="song.size"
                  class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/45 tabular-nums">
              {{ song.size }}
            </span>
          </div>
        </div>

        <!-- ── Lyrics ── -->
        <Transition name="lyric-slide">
          <div v-if="showLyric && lyricLines.length"
               class="mx-4 mb-3 rounded-xl overflow-hidden"
               style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
            <div class="h-24 flex flex-col items-center justify-center px-5 overflow-hidden">
              <TransitionGroup name="lyric-line" tag="div" class="w-full flex flex-col items-center">
                <div v-for="(line, slot) in visibleLyrics" :key="line ? line.time : ('empty-' + slot)"
                     :class="[
                       'w-full text-center transition-all duration-500 leading-snug select-none',
                       slot === 1
                         ? 'text-white text-[14px] font-bold h-10 flex flex-col justify-center'
                         : 'text-white/28 text-[11px] h-7 flex items-center justify-center'
                     ]">
                  <template v-if="line">
                    <div class="truncate px-2">{{ line.text }}</div>
                    <div v-if="slot === 1 && getTranslation(line.time)"
                         class="text-[11px] text-violet-200/55 font-normal truncate px-2 mt-0.5">
                      {{ getTranslation(line.time) }}
                    </div>
                  </template>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </Transition>

        <!-- ── Quality ── -->
        <div class="px-4 pb-2 flex-shrink-0" style="border-top: 1px solid rgba(255,255,255,0.07); padding-top: 0.6rem;">
          <div v-if="!song.url" class="mb-2">
            <p class="text-xs text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-center">
              ⚠️ 此音质无可用链接，请切换音质
            </p>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs text-white/22 shrink-0 mr-0.5">音质</span>
            <button v-for="q in qualities" :key="q.value"
                    @click="selectedLevel = q.value"
                    :class="[
                      'px-2 py-0.5 rounded-lg text-xs transition-all duration-200',
                      selectedLevel === q.value
                        ? 'bg-violet-500/35 border border-violet-400/40 text-violet-200'
                        : 'glass text-white/32 hover:text-white/65'
                    ]">
              {{ q.label }}
            </button>
            <button v-if="selectedLevel !== song.level"
                    @click="reloadWithQuality"
                    class="ml-auto glass-btn-accent rounded-lg px-3 py-0.5 text-xs text-white shrink-0">
              重新获取
            </button>
          </div>
        </div>

        <!-- ── Control ── -->
        <div class="flex-shrink-0" style="border-top: 1px solid rgba(255,255,255,0.07);">
          <audio ref="audio" :src="song.url" :volume="volume"
                 @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata" @ended="onEnded"
                 preload="metadata" style="display:none;"></audio>

          <!-- Seek bar -->
          <div class="px-5 pt-3 pb-1">
            <div class="progress-bar-track" @click="seek">
              <div class="progress-bar-inner" :style="{ width: progressPercent() + '%' }"></div>
            </div>
            <div class="flex justify-between mt-1.5">
              <span class="text-xs text-white/30 tabular-nums">{{ formatTime(currentTime) }}</span>
              <span class="text-xs text-white/30 tabular-nums">{{ formatTime(duration) }}</span>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex items-center justify-center gap-4 px-5 pb-2 mt-1">
            <!-- Lyric toggle -->
            <button @click="showLyric = !showLyric"
                    :class="['ctrl-btn', showLyric ? 'text-violet-300' : 'text-white/35 hover:text-white/65']"
                    title="歌词">
              <svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path d="M4 6h16M4 10h16M4 14h10"/>
              </svg>
            </button>

            <!-- Prev -->
            <button @click="playPrev" :disabled="!hasPrev"
                    :class="['ctrl-btn', hasPrev ? 'text-white/65 hover:text-white' : 'text-white/18 cursor-not-allowed']"
                    title="上一曲">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
              </svg>
            </button>

            <!-- Play / Pause -->
            <button @click="togglePlay" :disabled="!song.url"
                    class="w-14 h-14 glass-btn-accent rounded-full flex items-center justify-center
                           ring-2 ring-violet-400/30 shadow-xl
                           disabled:opacity-30 disabled:cursor-not-allowed
                           transition-transform active:scale-95">
              <svg v-if="!isPlaying" class="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>

            <!-- Next -->
            <button @click="playNext" :disabled="!hasNext"
                    :class="['ctrl-btn', hasNext ? 'text-white/65 hover:text-white' : 'text-white/18 cursor-not-allowed']"
                    title="下一曲">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zm2-6 5.5 3.94V8.06L8 12zm7.5-6v12h2V6h-2z"/>
              </svg>
            </button>

            <!-- Download -->
            <a :href="song.url ? getDownloadFileUrl(song.id, song.level) : undefined"
               :target="song.url ? '_blank' : undefined"
               :class="['ctrl-btn', song.url ? 'text-white/35 hover:text-white/65' : 'text-white/15 pointer-events-none']"
               title="下载当前音频">
              <svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </a>
          </div>

          <!-- Volume -->
          <div class="flex items-center gap-3 px-7 pb-4">
            <svg class="w-3.5 h-3.5 text-white/25 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3z"/>
            </svg>
            <input type="range" min="0" max="1" step="0.02" :value="volume"
                   @input="setVolume" class="slider flex-1" />
            <svg class="w-4 h-4 text-white/25 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>

<style scoped>
.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  transition: color 0.18s ease, transform 0.15s ease, opacity 0.15s ease;
  flex-shrink: 0;
}
.ctrl-btn:not([disabled]):active { transform: scale(0.85); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.lyric-slide-enter-active,
.lyric-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1), max-height 0.35s ease;
  max-height: 200px;
  overflow: hidden;
}
.lyric-slide-enter-from,
.lyric-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}

.lyric-line-move,
.lyric-line-enter-active,
.lyric-line-leave-active {
  transition: all 0.4s ease;
}
.lyric-line-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.lyric-line-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
.lyric-line-leave-active {
  position: absolute;
}
</style>

