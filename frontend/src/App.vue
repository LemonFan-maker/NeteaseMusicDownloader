<script setup>
import { ref, onMounted } from 'vue'
import { useMusicStore } from '@/stores/musicStore'
import SearchPanel from '@/components/SearchPanel.vue'
import PlayerPanel from '@/components/PlayerPanel.vue'
import DownloadQueue from '@/components/DownloadQueue.vue'
import PlaylistAlbumPanel from '@/components/PlaylistAlbumPanel.vue'

const store = useMusicStore()
const mode = ref('search')   // 'search' | 'playlist' | 'album'
const rightTab = ref('player') // 'player' | 'queue'

const modes = [
  { key: 'search',   label: '歌曲搜索' },
  { key: 'playlist', label: '歌单解析' },
  { key: 'album',    label: '专辑解析' },
]

onMounted(() => store.fetchHealth())
</script>

<template>
  <!-- ── Background ── -->
  <div class="relative min-h-screen overflow-hidden" style="background: #090d1f;">

    <!-- Ambient orbs -->
    <div class="orb w-[600px] h-[600px] top-[-200px] left-[-120px]"
         style="background: rgba(139,92,246,0.18); animation-duration: 14s;"></div>
    <div class="orb w-[500px] h-[500px] top-[25%] right-[-140px]"
         style="background: rgba(59,130,246,0.15); animation-duration: 18s; animation-delay:-4s;"></div>
    <div class="orb w-80 h-80 bottom-[-60px] left-[30%]"
         style="background: rgba(236,72,153,0.12); animation-duration: 22s; animation-delay:-8s;"></div>
    <div class="orb w-72 h-72 bottom-[15%] left-[-60px]"
         style="background: rgba(52,211,153,0.08); animation-duration: 26s; animation-delay:-12s;"></div>

    <!-- Dot grid + noise overlay -->
    <div class="absolute inset-0 pointer-events-none dot-grid opacity-100"></div>
    <div class="absolute inset-0 pointer-events-none opacity-[0.025]"
         style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%221%22/></svg>');"></div>

    <!-- ── App Shell ── -->
    <div class="relative z-10 flex flex-col min-h-screen p-4 md:p-6 lg:p-8 gap-5 max-w-[1440px] mx-auto">

      <!-- ── Header ── -->
      <header class="flex items-center justify-between animate-slide-up">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl glass-btn-accent animate-glow-pulse flex items-center justify-center ring-1 ring-violet-400/30">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-black gradient-text leading-none tracking-tight">网易云音乐解析器</h1>
            <p class="text-xs text-white/35 mt-0.5 tracking-widest uppercase">Netease Music Downloader</p>
          </div>
        </div>

        <!-- Health indicator -->
        <div class="flex items-center gap-2 glass rounded-full px-3 py-1.5">
          <div :class="[
            'w-2 h-2 rounded-full',
            store.health ? 'bg-emerald-400' : 'bg-red-400/70'
          ]" style="box-shadow: 0 0 6px currentColor"></div>
          <span class="text-xs text-white/60">
            {{ store.health ? store.health.version ?? '在线' : '离线' }}
          </span>
        </div>
      </header>

      <!-- ── Mode tabs ── -->
      <nav class="flex gap-2 animate-slide-up" style="animation-delay:0.05s">
        <button
          v-for="m in modes" :key="m.key"
          @click="mode = m.key"
          :class="[
            'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
            mode === m.key
              ? 'glass-btn-accent text-white shadow-lg'
              : 'glass text-white/50 hover:text-white/80 hover:bg-white/10'
          ]"
        >{{ m.label }}</button>
      </nav>

      <!-- ── Main Content ── -->
      <!-- minmax(0,1fr) 防止长文本撑开左列挤走右侧面板 -->
      <div class="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-5">

        <!-- Left panel -->
        <div class="animate-slide-up min-w-0" style="animation-delay:0.1s">
          <SearchPanel v-if="mode === 'search'" />
          <PlaylistAlbumPanel v-else :mode="mode" />
        </div>

        <!-- Right panel -->
        <div class="flex flex-col gap-4 animate-slide-in-right self-start" style="animation-delay:0.15s">

          <!-- Right tabs -->
          <div class="flex gap-2">
            <button
              v-for="tab in [{key:'player',label:'歌曲详情'},{key:'queue',label:`下载队列${store.downloadQueue.length ? ' · '+store.downloadQueue.length : ''}`}]"
              :key="tab.key"
              @click="rightTab = tab.key"
              :class="[
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                rightTab === tab.key
                  ? 'glass-btn-accent text-white'
                  : 'glass text-white/50 hover:text-white/80 hover:bg-white/10'
              ]"
            >{{ tab.label }}</button>
          </div>

          <!-- Right content -->
          <Transition name="panel-switch" mode="out-in">
            <PlayerPanel v-if="rightTab === 'player'" key="player" />
            <DownloadQueue v-else key="queue" />
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.panel-switch-enter-active,
.panel-switch-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1);
}
.panel-switch-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.panel-switch-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
