const fs = require('fs')

// Expose services to the renderer process
window.services = {
    // Read file from path and return buffer + stats
    readApk: (path) => {
        try {
            const buffer = fs.readFileSync(path)
            const stats = fs.statSync(path)
            return {
                buffer: buffer,
                name: path.split(/[\\/]/).pop(),
                size: stats.size,
                mtime: stats.mtime
            }
        } catch (e) {
            console.error('Failed to read file:', e)
            return null
        }
    },
    // Set window always on top
    setAlwaysOnTop: (flag) => {
        if (typeof utools !== 'undefined' && utools.setAlwaysOnTop) {
            utools.setAlwaysOnTop(flag)
        }
    },
    // Open APK file dialog
    openApkDialog: () => {
        if (typeof utools === 'undefined') return null
        const paths = utools.showOpenDialog({
            title: '选择 APK 文件',
            filters: [{ name: 'APK', extensions: ['apk'] }],
            properties: ['openFile']
        })
        if (paths && paths.length > 0) {
            return paths[0]
        }
        return null
    }
}
