/**
 * 网易云音乐 API 服务层
 * 所有 HTTP 请求均通过此模块发出，与后端 Flask 路由对应。
 */
import axios from 'axios'

const http = axios.create({
  baseURL: '/',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// 统一错误拦截
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.message ||
      '请求失败，请检查网络连接'
    return Promise.reject(new Error(message))
  }
)

/** 健康检查 */
export const checkHealth = () => http.get('/health')

/** 搜索音乐  keyword: string, limit?: number */
export const searchMusic = (keyword, limit = 30) =>
  http.get('/search', { params: { keyword, limit } })

/**
 * 获取歌曲信息
 * @param {string} id    歌曲 ID
 * @param {'url'|'name'|'lyric'|'json'} type
 * @param {string} level 音质
 */
export const getSongInfo = (id, type = 'json', level = 'lossless') =>
  http.get('/song', { params: { id, type, level } })

/** 获取歌单详情 */
export const getPlaylist = (id) =>
  http.get('/playlist', { params: { id } })

/** 获取专辑详情 */
export const getAlbum = (id) =>
  http.get('/album', { params: { id } })

/**
 * 触发服务端下载（返回 JSON 信息）
 * @param {string} id       歌曲 ID
 * @param {string} quality  音质
 */
export const downloadSong = (id, quality = 'lossless') =>
  http.get('/download', { params: { id, quality, format: 'json' } })

/** 构建直接下载文件的 URL */
export const getDownloadFileUrl = (id, quality = 'lossless') =>
  `/download?id=${encodeURIComponent(id)}&quality=${quality}&format=file`

/** API 信息 */
export const getApiInfo = () => http.get('/api/info')
