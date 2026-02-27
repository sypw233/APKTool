import React, { useState, useCallback, useEffect } from 'react'
import ApkDropZone from './components/ApkDropZone'
import ApkInfoViewer from './components/ApkInfoViewer'
import { AndroidAppParser } from '@seayoo-web/app-info'
import ApkParser from 'app-info-parser/src/apk'
import SparkMD5 from 'spark-md5'
import './main.css'

function App() {
  const [apkInfo, setApkInfo] = useState(null)
  const [fileInfo, setFileInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

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


  // 计算文件哈希
  const calculateHashes = async (file) => {
    const buffer = await file.arrayBuffer()

    // SHA-1
    const hashBuffer = await crypto.subtle.digest('SHA-1', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const sha1 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // SHA-256
    const md5Buffer = await crypto.subtle.digest('SHA-256', buffer)
    const sha256Array = Array.from(new Uint8Array(md5Buffer))
    const sha256 = sha256Array.map(b => b.toString(16).padStart(2, '0')).join('')

    // MD5
    const spark = new SparkMD5.ArrayBuffer()
    spark.append(buffer)
    const md5 = spark.end()

    return { sha1, sha256, md5 }
  }

  const handleFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.apk')) {
      setError('请选择有效的 APK 文件')
      return
    }

    setLoading(true)
    setError(null)
    setApkInfo(null)
    setFileInfo(null)

    try {
      // 基本文件信息
      const hashes = await calculateHashes(file)

      setFileInfo({
        name: file.name,
        sizeBytes: file.size,
        lastModified: new Date(file.lastModified).toLocaleString(),
        sha1: hashes.sha1,
        sha256: hashes.sha256,
        md5: hashes.md5
      })

      // 使用 @seayoo-web/app-info 解析完整 manifest (包含 activities)
      const parser = new AndroidAppParser(file)
      const result = await parser.parse()

      if (result instanceof Error) {
        throw new Error(result.message)
      }

      // 使用 app-info-parser 解析已解析的应用名称
      let resolvedLabel = null
      try {
        const nameParser = new ApkParser(file)
        const nameResult = await nameParser.parse()
        const rawLabel = nameResult?.application?.label
        if (rawLabel) {
          // 资源解析后可能是数组(多语言), 取第一个非空字符串
          if (Array.isArray(rawLabel)) {
            resolvedLabel = rawLabel.find(l => typeof l === 'string' && l.length > 0 && !l.startsWith('resourceId:')) || null
          } else if (typeof rawLabel === 'string' && rawLabel.length > 0 && !rawLabel.startsWith('resourceId:')) {
            resolvedLabel = rawLabel
          }
        }
      } catch (nameErr) {
        console.warn('app-info-parser label resolution failed:', nameErr)
      }

      // 合并结果: 使用解析后的应用名称覆盖资源引用
      if (resolvedLabel && result.manifest?.application) {
        result.manifest.application.label = resolvedLabel
      }

      console.log('Parsed APK:', result)
      setApkInfo(result)
    } catch (e) {
      console.error(e)
      setError('解析 APK 失败: ' + (e.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

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

  const handleReset = () => {
    setApkInfo(null)
    setFileInfo(null)
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
        }}>
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

      {loading ? (
        <div className="container" style={{ minHeight: '100vh', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
            <div className="loading-spinner"></div>
            <p>正在解析 APK 文件，请稍候...</p>
          </div>
        </div>
      ) : apkInfo ? (
        <div className="container" style={{ minHeight: '100vh', boxSizing: 'border-box' }}>
          <ApkInfoViewer apkInfo={apkInfo} fileInfo={fileInfo} onReset={handleReset} />
        </div>
      ) : (
        <div style={{ width: '100vw', height: '100vh', padding: '2rem', boxSizing: 'border-box' }}>
          <ApkDropZone onFileSelected={handleFileSelected} />
        </div>
      )}
    </>
  )
}

export default App
