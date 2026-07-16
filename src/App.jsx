/* global Worker */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import ApkDropZone from './components/ApkDropZone'
import ApkInfoViewer from './components/ApkInfoViewer'
import HistoryFab from './components/HistoryFab'
import { saveHistory } from './lib/history-store'
import './main.css'

const STAGE_LABELS = {
  hash: '正在计算文件哈希...',
  zip: '正在解压 APK...',
  manifest: '正在解析 Manifest...',
  signature: '正在解析签名信息...'
}

function App () {
  const [apkInfo, setApkInfo] = useState(null)
  const [fileInfo, setFileInfo] = useState(null)
  const [apkFiles, setApkFiles] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [progress, setProgress] = useState('')
  const workerRef = useRef(null)

  useEffect(() => {
    const worker = new Worker(
      new URL('./lib/apk-worker.js', import.meta.url),
      { type: 'module' }
    )
    workerRef.current = worker
    return () => worker.terminate()
  }, [])

  // uTools Integration
  useEffect(() => {
    if (window.utools) {
      window.utools.onPluginEnter(({ code, type, payload }) => {
        console.log('uTools Enter:', { code, type, payload })

        // Always on top
        if (window.services?.setAlwaysOnTop) {
          window.services.setAlwaysOnTop(true)
        }

        // Handle file input
        if (type === 'files' && payload.length > 0) {
          const fileObj = payload[0]
          if (fileObj.isFile && window.services?.readApk) {
            try {
              const readResult = window.services.readApk(fileObj.path)
              if (!readResult) {
                throw new Error('未读取到文件内容')
              }
              const { buffer, name, mtime } = readResult

              // Create native File object from buffer
              const file = new File([buffer], name, {
                type: 'application/vnd.android.package-archive',
                lastModified: new Date(mtime).getTime()
              })
              handleFile(file)
            } catch (e) {
              console.error('uTools file load error:', e)
              setError('读取文件失败: ' + (e.message || '未知错误'))
            }
          }
        }
      })
    }
  }, [])

  const handleFile = useCallback(async (file) => {
    if (!file.name.toLowerCase().endsWith('.apk')) {
      setError('请选择有效的 APK 文件')
      return
    }

    setLoading(true)
    setError(null)
    setApkInfo(null)
    setFileInfo(null)
    setApkFiles(null)
    setProgress('hash')

    const worker = workerRef.current
    if (!worker) {
      setError('Worker 未就绪')
      setLoading(false)
      return
    }

    worker.onmessage = (e) => {
      const { type } = e.data

      if (type === 'progress') {
        setProgress(e.data.stage)
        return
      }

      if (type === 'result') {
        const { apkInfo: info, fileInfo: fInfo, apkFiles: fFiles, hashes, filePath } = e.data.data
        console.log('Parsed APK:', info)
        setFileInfo(fInfo)
        setApkInfo(info)
        setApkFiles(fFiles)

        saveHistory({
          id: Date.now(),
          packageName: info.basicInfo.packageName,
          appName: info.basicInfo.appName,
          versionName: info.basicInfo.versionName,
          versionCode: info.basicInfo.versionCode,
          icon: info.basicInfo.icon,
          fileSize: file.size,
          md5: hashes.md5,
          filePath: filePath || file.path || file.name,
          apkInfo: info,
          fileInfo: fInfo,
          apkFiles: fFiles
        })

        setLoading(false)
        setProgress('')
        return
      }

      if (type === 'error') {
        setError('解析 APK 失败: ' + e.data.message)
        setLoading(false)
        setProgress('')
      }
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      worker.postMessage({
        type: 'parse',
        arrayBuffer,
        fileName: file.name,
        fileSize: file.size,
        filePath: file.path || file.name
      }, [arrayBuffer])
    } catch (e) {
      console.error(e)
      setError('读取文件失败: ' + (e.message || '未知错误'))
      setLoading(false)
      setProgress('')
    }
  }, [])

  // 全局拖拽事件处理
  useEffect(() => {
    const handleGlobalDragEnter = (e) => {
      e.preventDefault()
      // 只处理文件拖拽
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDragOver(true)
      }
    }

    // 防止浏览器默认行为（例如打开文件）
    const handleGlobalDragOver = (e) => {
      e.preventDefault()
    }

    const handleGlobalDrop = (e) => {
      e.preventDefault()
    }

    window.addEventListener('dragenter', handleGlobalDragEnter)
    window.addEventListener('dragover', handleGlobalDragOver)
    window.addEventListener('drop', handleGlobalDrop)

    return () => {
      window.removeEventListener('dragenter', handleGlobalDragEnter)
      window.removeEventListener('dragover', handleGlobalDragOver)
      window.removeEventListener('drop', handleGlobalDrop)
    }
  }, [])

  const handleOverlayDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleOverlayDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleOverlayDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelected = (file) => {
    handleFile(file)
  }

  const handleHistorySelect = (record) => {
    if (!record.apkInfo) return
    setApkInfo(record.apkInfo)
    setFileInfo(record.fileInfo || null)
    setApkFiles(record.apkFiles || null)
    setError(null)
  }

  const handleReset = () => {
    setApkInfo(null)
    setFileInfo(null)
    setApkFiles(null)
    setError(null)
  }

  return (
    <>
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#721c24',
          backgroundColor: '#f8d7da',
          borderColor: '#f5c6cb',
          padding: '10px',
          maxWidth: '600px',
          borderRadius: '5px',
          textAlign: 'center',
          zIndex: 10000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
        >
          {error}
        </div>
      )}

      {isDragOver && (
        <div
          onDragLeave={handleOverlayDragLeave}
          onDragOver={handleOverlayDragOver}
          onDrop={handleOverlayDrop}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '2em',
            zIndex: 9999
          }}
        >
          <span style={{ pointerEvents: 'none' }}>释放以解析 APK</span>
        </div>
      )}

      {loading
        ? (
          <div className='container' style={{ minHeight: '100vh', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
              <div className='loading-spinner' />
              <p>{STAGE_LABELS[progress] || '正在解析 APK 文件，请稍候...'}</p>
            </div>
          </div>
          )
        : apkInfo
          ? (
            <div className='container' style={{ minHeight: '100vh', boxSizing: 'border-box' }}>
              <ApkInfoViewer
                apkInfo={apkInfo}
                fileInfo={fileInfo}
                apkFiles={apkFiles}
                onReset={handleReset}
              />
            </div>
            )
          : (
            <div style={{ width: '100vw', height: '100vh', padding: '2rem', boxSizing: 'border-box' }}>
              <ApkDropZone onFileSelected={handleFileSelected} />
            </div>
            )}

      <HistoryFab onSelectRecord={handleHistorySelect} />
    </>
  )
}

export default App
