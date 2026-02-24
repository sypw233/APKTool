import React, { useCallback } from 'react'

const ApkDropZone = ({ onFileSelected }) => {
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.name.toLowerCase().endsWith('.apk')) {
        onFileSelected(file)
      } else {
        alert('请选择有效的 APK 文件')
      }
    }
  }, [onFileSelected])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleFileChange = useCallback((e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelected(files[0])
    }
  }, [onFileSelected])

  const handleClick = () => {
    if (window.services?.openApkDialog && window.services?.readApk) {
      // Use uTools native dialog
      try {
        const path = window.services.openApkDialog()
        if (path) {
          const result = window.services.readApk(path)
          if (result) {
            const { buffer, name, mtime } = result
            const file = new File([buffer], name, {
              type: 'application/vnd.android.package-archive',
              lastModified: new Date(mtime).getTime()
            })
            onFileSelected(file)
          }
        }
      } catch (error) {
        console.error('Failed to open file dialog:', error)
        alert('打开文件失败')
      }
    } else {
      // Fallback to browser file input
      document.getElementById('fileInput').click()
    }
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
      style={{
        border: '2px dashed #cccccc',
        borderRadius: '10px',
        padding: '40px',
        textAlign: 'center',
        cursor: 'pointer',
        margin: '20px',
        userSelect: 'none',
        transition: 'border-color 0.3s'
      }}
      className="drop-zone"
    >
      <input
        type="file"
        id="fileInput"
        style={{ display: 'none' }}
        accept=".apk"
        onChange={handleFileChange}
        onClick={(e) => e.stopPropagation()} // Prevent double trigger if bubbling
      />
      <div style={{ fontSize: '1.2em', color: '#666' }}>
        点击或拖拽 APK 文件到此处
      </div>
      <p style={{ marginTop: '10px', color: '#999', fontSize: '0.9em' }}>
        支持 .apk 格式
      </p>
    </div>
  )
}

export default ApkDropZone
