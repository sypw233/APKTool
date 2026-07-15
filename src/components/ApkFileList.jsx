import React, { useState } from 'react'

function formatSize (bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}

function FileRow ({ file }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 12px',
        borderBottom: '1px solid #f0f0f0'
      }}
    >
      <span style={{
        fontFamily: 'Menlo, Monaco, Consolas, monospace',
        fontSize: '12px',
        color: '#333',
        wordBreak: 'break-all',
        flex: 1
      }}
      >
        {file.path}
      </span>
      <span style={{ fontSize: '11px', color: '#999', marginLeft: '12px', whiteSpace: 'nowrap' }}>
        {formatSize(file.size)}
      </span>
    </div>
  )
}

function AbiSection ({ abi, libs }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: '#fafafa',
          borderRadius: '4px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <span style={{ marginRight: '8px', fontSize: '10px', color: '#666' }}>
          {collapsed ? '▶' : '▼'}
        </span>
        <span style={{ fontWeight: 'bold', color: '#333' }}>{abi}</span>
        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>
          ({libs.length} 个文件)
        </span>
      </div>
      {!collapsed && (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: '0 0 4px 4px' }}>
          {libs.map(lib => (
            <FileRow
              key={lib.path}
              file={lib}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ApkFileList ({ files, nativeLibs, supportedABIs }) {
  const [filter, setFilter] = useState('')

  const dexFiles = files.filter(f => f.name.endsWith('.dex'))
  const soFiles = files.filter(f => f.name.endsWith('.so'))
  const otherFiles = files.filter(f => !f.name.endsWith('.dex') && !f.name.endsWith('.so'))

  const filteredFiles = filter
    ? files.filter(f => f.path.toLowerCase().includes(filter.toLowerCase()))
    : null

  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0)

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '8px'
      }}
      >
        <div style={{ fontSize: '13px', color: '#666' }}>
          共 {files.length} 个文件，总大小 {formatSize(totalSize)}
          {dexFiles.length > 0 && <span style={{ marginLeft: '12px' }}>DEX: {dexFiles.length}</span>}
          {soFiles.length > 0 && <span style={{ marginLeft: '12px' }}>SO: {soFiles.length}</span>}
        </div>
        <input
          type='text'
          placeholder='搜索文件...'
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '4px 8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            fontSize: '12px',
            width: '180px',
            outline: 'none'
          }}
        />
      </div>

      {filteredFiles
        ? (
          <div style={{ border: '1px solid #f0f0f0', borderRadius: '4px', maxHeight: '600px', overflowY: 'auto' }}>
            {filteredFiles.map(f => (
              <FileRow key={f.path} file={f} />
            ))}
            {filteredFiles.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>无匹配文件</div>
            )}
          </div>
          )
        : (
          <>
            {supportedABIs.length > 0 && nativeLibs && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                  原生库 ({soFiles.length} 个 .so 文件)
                </div>
                {supportedABIs.map(abi => (
                  <AbiSection
                    key={abi}
                    abi={abi}
                    libs={nativeLibs[abi] || []}
                  />
                ))}
              </div>
            )}

            {dexFiles.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                  DEX 文件 ({dexFiles.length})
                </div>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                  {dexFiles.map(f => <FileRow key={f.path} file={f} />)}
                </div>
              </div>
            )}

            {otherFiles.length > 0 && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                  其他文件 ({otherFiles.length})
                </div>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: '4px', maxHeight: '400px', overflowY: 'auto' }}>
                  {otherFiles.slice(0, 100).map(f => <FileRow key={f.path} file={f} />)}
                  {otherFiles.length > 100 && (
                    <div style={{ padding: '8px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
                      仅显示前 100 个文件，使用搜索查找更多
                    </div>
                  )}
                </div>
              </div>
            )}

            {files.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                无法读取文件列表
              </div>
            )}
          </>
          )}
    </div>
  )
}

export default ApkFileList
