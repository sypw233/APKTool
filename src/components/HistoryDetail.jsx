import React from 'react'

function formatTime (ts) {
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatSize (bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

const labelStyle = { fontWeight: 'bold', color: '#555', fontSize: '13px', width: '90px', flexShrink: 0 }
const valueStyle = { flex: 1, color: '#333', fontSize: '13px', wordBreak: 'break-all' }
const rowStyle = { display: 'flex', alignItems: 'flex-start', marginBottom: '14px' }

function HistoryDetail ({ record, onClose }) {
  if (!record) return null

  const handleCopy = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20000
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '480px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0
        }}
        >
          {record.icon
            ? (
              <img
                src={record.icon}
                alt=''
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              )
            : (
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: '#eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#999'
              }}
              >
                APK
              </div>
              )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              {record.appName || record.packageName}
            </div>
            <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
              {record.packageName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              color: '#666',
              backgroundColor: '#f0f0f0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            关闭
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            版本信息
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>版本名:</span>
            <span style={valueStyle}>{record.versionName || '-'}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>版本号:</span>
            <span style={valueStyle}>{record.versionCode || '-'}</span>
          </div>

          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '16px', marginTop: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            文件信息
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>文件大小:</span>
            <span style={valueStyle}>{formatSize(record.fileSize)}</span>
          </div>
          {record.md5 && (
            <div style={rowStyle}>
              <span style={labelStyle}>MD5:</span>
              <span
                onClick={() => handleCopy(record.md5)}
                title='点击复制'
                style={{ ...valueStyle, fontFamily: 'monospace', fontSize: '12px', color: '#d63384', cursor: 'pointer' }}
              >
                {record.md5}
              </span>
            </div>
          )}

          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '16px', marginTop: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            解析记录
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>解析时间:</span>
            <span style={valueStyle}>{formatTime(record.parsedAt)}</span>
          </div>
          {record.filePath && (
            <div style={rowStyle}>
              <span style={labelStyle}>文件路径:</span>
              <span
                onClick={() => handleCopy(record.filePath)}
                title='点击复制'
                style={{ ...valueStyle, fontFamily: 'monospace', fontSize: '12px', color: '#666', cursor: 'pointer' }}
              >
                {record.filePath}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistoryDetail
