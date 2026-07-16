import React, { useState, useEffect, useRef } from 'react'
import { getHistory, removeHistory, clearHistory } from '../lib/history-store'

function formatTime (ts) {
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatSize (bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function HistoryFab ({ onSelectRecord }) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState([])
  const panelRef = useRef(null)

  useEffect(() => {
    if (open) {
      setHistory(getHistory())
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleRemove = (id) => {
    const updated = removeHistory(id)
    setHistory(updated)
  }

  const handleClear = () => {
    const updated = clearHistory()
    setHistory(updated)
  }

  return (
    <>
      {open && history.length > 0 && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '360px',
            maxHeight: '70vh',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
          >
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
              解析历史
            </span>
            <button
              onClick={handleClear}
              style={{
                padding: '2px 10px',
                fontSize: '11px',
                color: '#ff4d4f',
                backgroundColor: 'transparent',
                border: '1px solid #ff4d4f',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              清空
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {history.map(record => (
              <div
                key={record.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f5f5f5',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                {record.icon
                  ? (
                    <img
                      src={record.icon}
                      alt=''
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        flexShrink: 0,
                        objectFit: 'cover'
                      }}
                    />
                    )
                  : (
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#eee',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#999'
                    }}
                    >
                      APK
                    </div>
                    )}

                <div
                  onClick={() => { if (onSelectRecord) onSelectRecord(record) }}
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  >
                    {record.appName || record.packageName}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#999',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  >
                    {record.packageName} · v{record.versionName}
                  </div>
                  {record.filePath && (
                    <div
                      title={record.filePath}
                      style={{
                        fontSize: '11px',
                        color: '#bbb',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px'
                      }}
                    >
                      {record.filePath}
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: '#ccc', marginTop: '2px' }}>
                    {formatTime(record.parsedAt)}
                    {record.fileSize ? ` · ${formatSize(record.fileSize)}` : ''}
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(record.id)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '14px',
                    color: '#ccc',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                    lineHeight: 1
                  }}
                  onMouseEnter={e => { e.target.style.color = '#ff4d4f' }}
                  onMouseLeave={e => { e.target.style.color = '#ccc' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,123,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          zIndex: 10002,
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,123,255,0.4)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)'
        }}
        title='解析历史'
      >
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
          <circle cx='12' cy='12' r='10' />
          <polyline points='12 6 12 12 16 14' />
        </svg>
      </button>
    </>
  )
}

export default HistoryFab
