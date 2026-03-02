import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import {
  searchMusic,
  getSongInfo,
  getPlaylist,
  getAlbum,
  downloadSong,
  checkHealth,
} from '@/api'

// ─── Download queue item 结构 ───────────────────────────────────
// { id, name, artist, quality, status: 'pending'|'downloading'|'done'|'error',
//   progress: 0-100, message, result }

export const useMusicStore = defineStore('music', () => {
  // ─── State ─────────────────────────────────────────────────────
  const searchResults   = ref([])
  const searchLoading   = ref(false)
  const searchError     = ref('')
  const searchKeyword   = ref('')

  const currentSong     = ref(null)   // 当前选中/播放的歌曲详情
  const songLoading     = ref(false)
  const songError       = ref('')

  const downloadQueue   = ref([])     // 下载队列
  const health          = ref(null)

  const playlist        = reactive({ data: null, loading: false, error: '' })
  const album           = reactive({ data: null, loading: false, error: '' })

  // ─── Actions ───────────────────────────────────────────────────

  /** 搜索 */
  async function search(keyword, limit = 30) {
    if (!keyword?.trim()) return
    searchKeyword.value = keyword.trim()
    searchLoading.value = true
    searchError.value   = ''
    // 不在加载前清空旧结果，避免布局抖动；等新数据回来后再替换
    try {
      const res = await searchMusic(keyword.trim(), limit)
      searchResults.value = res.data ?? []
    } catch (e) {
      searchError.value   = e.message
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  /** 加载歌曲详情 */
  async function loadSong(id, level = 'lossless') {
    songLoading.value = true
    songError.value   = ''
    currentSong.value = null
    try {
      const res = await getSongInfo(id, 'json', level)
      if (res.success) {
        currentSong.value = res.data
      } else {
        songError.value = res.message || '获取歌曲信息失败'
      }
    } catch (e) {
      songError.value = e.message
    } finally {
      songLoading.value = false
    }
  }

  /** 将歌曲加入下载队列并执行下载 */
  async function addToDownloadQueue(song, quality = 'lossless') {
    const existing = downloadQueue.value.find(
      (d) => d.id === song.id && d.quality === quality
    )
    if (existing) return  // 避免重复加入

    const item = reactive({
      id: song.id,
      name: song.name ?? song.song_name ?? '未知歌曲',
      artist: song.artists ?? song.ar?.map((a) => a.name).join(', ') ?? '',
      quality,
      status: 'pending',
      progress: 0,
      message: '等待中…',
      result: null,
    })

    downloadQueue.value.push(item)
    _runDownload(item)
  }

  async function _runDownload(item) {
    item.status   = 'downloading'
    item.message  = '准备下载…'
    item.progress = 10

    try {
      // 模拟进度（接口是同步的，没有流式进度）
      const progressTimer = setInterval(() => {
        if (item.progress < 85) item.progress += Math.random() * 12
      }, 400)

      const res = await downloadSong(item.id, item.quality)

      clearInterval(progressTimer)
      item.progress = 100
      item.status   = 'done'
      item.message  = '下载完成'
      item.result   = res.data ?? null
    } catch (e) {
      item.status  = 'error'
      item.message = e.message
    }
  }

  /** 移除队列项 */
  function removeFromQueue(index) {
    downloadQueue.value.splice(index, 1)
  }

  /** 清除已完成/错误的队列项 */
  function clearFinishedQueue() {
    downloadQueue.value = downloadQueue.value.filter(
      (d) => d.status === 'pending' || d.status === 'downloading'
    )
  }

  /** 加载歌单 */
  async function loadPlaylist(id) {
    playlist.loading = true
    playlist.error   = ''
    playlist.data    = null
    try {
      const res = await getPlaylist(id)
      playlist.data = res.data?.playlist ?? null
    } catch (e) {
      playlist.error = e.message
    } finally {
      playlist.loading = false
    }
  }

  /** 加载专辑 */
  async function loadAlbum(id) {
    album.loading = true
    album.error   = ''
    album.data    = null
    try {
      const res = await getAlbum(id)
      album.data = res.data?.album ?? null
    } catch (e) {
      album.error = e.message
    } finally {
      album.loading = false
    }
  }

  /** 健康检查 */
  async function fetchHealth() {
    try {
      const res = await checkHealth()
      health.value = res.data
    } catch { health.value = null }
  }

  return {
    // state
    searchResults, searchLoading, searchError, searchKeyword,
    currentSong, songLoading, songError,
    downloadQueue, health,
    playlist, album,
    // actions
    search, loadSong,
    addToDownloadQueue, removeFromQueue, clearFinishedQueue,
    loadPlaylist, loadAlbum, fetchHealth,
  }
})
