# Netease Music Downloader

## 项目简介
Netease URL Downloader 是一个用于下载网易云音乐的工具。它提供了一个简单的前端界面和强大的后端功能，支持通过网易云音乐的 URL 搜索、播放和下载音乐。

## 功能特性
- **音乐搜索**：通过网易云音乐的 URL 搜索音乐。
- **音乐播放**：支持在线播放音乐。
- **音乐下载**：将音乐下载到本地。
- **登录功能**：支持二维码登录网易云音乐。
- **下载队列管理**：查看和管理当前的下载任务。

## 项目结构
```
NeteaseMusicDownloader/
├── cookie_manager.py        # 管理 Cookie 的模块
├── cookie.txt               # 存储登录后的 Cookie
├── main.py                  # 项目入口文件
├── music_api.py             # 与网易云音乐 API 交互的模块
├── music_downloader.py      # 音乐下载功能模块
├── qr_login.py              # 二维码登录功能模块
├── requirements.txt         # Python 依赖文件
├── downloads/               # 下载的音乐文件存储目录
├── frontend/                # 前端代码目录
│   ├── index.html           # 前端入口 HTML 文件
│   ├── package.json         # 前端依赖配置文件
│   ├── vite.config.js       # Vite 配置文件
│   ├── public/              # 静态资源目录
│   └── src/                 # 前端源码目录
│       ├── App.vue          # Vue 主组件
│       ├── main.js          # 前端入口文件
│       ├── style.css        # 全局样式文件
│       ├── api/             # 前端 API 模块
│       ├── assets/          # 前端资源文件
│       └── components/      # Vue 组件目录
│           ├── DownloadQueue.vue
│           ├── PlayerPanel.vue
│           ├── PlaylistAlbumPanel.vue
│           └── SearchPanel.vue
├── templates/               # 后端模板目录
│   └── index.html           # 后端渲染的 HTML 模板
```

## 环境依赖
### 后端依赖
- Python 3.10+
- 依赖库：见 `requirements.txt`

### 前端依赖
- Node.js 18+
- pnpm（推荐）

## 安装与运行
### 后端
1. 克隆项目：
   ```bash
   git clone https://github.com/LemonFan-maker/NeteaseMusicDownloader.git
   cd Netease_url
   ```
2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
3. 准备
   1. 登录网页版网易云音乐，打开[每日歌曲推荐](https://music.163.com/#/discover/recommend/taste)
   2. 使用F12界面进行调试，选择Network/网络选项卡
   3. 刷新界面
   4. 使用File/文件进行筛选，双击File/文件为`/`的项
   5. 找到cookie的内容，选择copy value/复制值
   6. 在cookie中找到`MUSIC_U=`开头的内容，到`;`结束，填入cookie.txt的内容中。

4. 运行后端服务：
   ```bash
   python main.py
   ```

### 前端
1. 进入前端目录：
   ```bash
   cd frontend
   ```
2. 安装依赖：
   ```bash
   pnpm install
   ```
3. 启动开发服务器：
   ```bash
   pnpm dev
   ```

前端服务默认运行在 `http://localhost:5173`，后端服务默认运行在 `http://localhost:5000`。

## 使用说明
1. 打开浏览器，访问前端地址。
2. 在搜索框中输入网易云音乐的 URL，点击搜索。
3. 在搜索结果中选择音乐进行播放或下载。
4. 登录后可访问更多功能。

## 贡献指南
欢迎对本项目进行贡献！
1. Fork 本仓库。
2. 创建你的功能分支：`git checkout -b feature/<你的功能>`。
3. 提交更改：`git commit -m '添加新功能'`。
4. 推送到分支：`git push origin feature/<你的功能>`。
5. 提交 Pull Request。

## 许可证
本项目基于 [MIT License](LICENSE) 许可证开源。