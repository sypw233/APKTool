# APK 分析工具 (APK Analyzer)

这是一个基于React开发的 APK 解析与信息查看工具。它最初设计为 [uTools](https://u.tools/) 插件，但也完全支持作为普通的网页独立在一台服务器或 GitHub Pages 上运行。

## 主要功能

- **拖拽解析**：直接将 `.apk` 文件拖入页面即可开始解析。
- **基本信息提取**：一键获取应用的包名 (Package Name)、版本名称 (Version Name)、版本号 (Version Code) 以及应用名称。
- **文件校验和**：自动在本地计算文件的 MD5、SHA-1 和 SHA-256 哈希值。
- **安全与隐私**：所有解析工作都是在你的浏览器内纯本地进行，**不会**上传任何文件到服务器。

## 技术栈

- [React](https://reactjs.org/) (UI 框架)
- [Vite](https://vitejs.dev/) (构建工具)
- [@seayoo-web/app-info](https://www.npmjs.com/package/@seayoo-web/app-info) (APK 解析核心)
- [spark-md5](https://www.npmjs.com/package/spark-md5) (哈希计算)



## 自动部署 (GitHub Pages)

本项目已配置 GitHub Actions。当你将代码推送到 `main` 或 `master` 分支时，项目会自动构建并将生成的网页部署到 GitHub Pages。
