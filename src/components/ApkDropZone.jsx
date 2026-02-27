import React, { useCallback } from 'react'

const ApkDropZone = ({ onFileSelected }) => {
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
      onClick={handleClick}
      style={{
        border: '3px dashed #cccccc',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.3s ease',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box'
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
