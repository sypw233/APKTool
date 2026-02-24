import React, { useState } from 'react'

// android: 命名空间属性映射
const ANDROID_ATTRS = new Set([
    'name', 'label', 'icon', 'theme', 'versionCode', 'versionName',
    'minSdkVersion', 'targetSdkVersion', 'allowBackup', 'supportsRtl',
    'exported', 'enabled', 'permission', 'authorities', 'resource',
    'value', 'configChanges', 'screenOrientation', 'launchMode',
    'hardwareAccelerated', 'windowSoftInputMode', 'grantUriPermissions',
    'fullBackupContent', 'appComponentFactory', 'roundIcon',
    'networkSecurityConfig', 'debuggable', 'directBootAware',
    'required', 'glEsVersion'
])

// 标签名映射: JSON key → XML tag name
const TAG_MAP = {
    usesPermissions: 'uses-permission',
    usesPermissionsSDK23: 'uses-permission-sdk-23',
    permissions: 'permission',
    permissionTrees: 'permission-tree',
    permissionGroups: 'permission-group',
    usesFeatures: 'uses-feature',
    usesSdk: 'uses-sdk',
    usesConfiguration: 'uses-configuration',
    usesLibraries: 'uses-library',
    supportsScreens: 'supports-screens',
    compatibleScreens: 'compatible-screens',
    supportsGlTextures: 'supports-gl-texture',
    activities: 'activity',
    activityAliases: 'activity-alias',
    launcherActivities: null,
    services: 'service',
    receivers: 'receiver',
    providers: 'provider',
    intentFilters: 'intent-filter',
    metaData: 'meta-data',
    actions: 'action',
    categories: 'category',
    grantUriPermissions: 'grant-uri-permission',
    pathPermissions: 'path-permission',
    data: 'data'
}

// 跳过这些 key 不作为属性输出 (已作为子元素处理)
const CHILD_KEYS = new Set(Object.keys(TAG_MAP))
CHILD_KEYS.add('application')

function formatAttrName(key) {
    if (ANDROID_ATTRS.has(key)) return `android:${key}`
    return key
}

function escapeXml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function manifestToXml(manifest) {
    const lines = []
    lines.push('<?xml version="1.0" encoding="utf-8"?>')

    function renderElement(tagName, obj, indent) {
        if (!obj || typeof obj !== 'object') return
        const pad = '    '.repeat(indent)

        // 收集属性
        const attrs = []
        const childElements = []

        for (const [key, value] of Object.entries(obj)) {
            if (CHILD_KEYS.has(key)) {
                childElements.push({ key, value })
            } else if (value !== null && value !== undefined && typeof value !== 'object') {
                attrs.push(`${formatAttrName(key)}="${escapeXml(value)}"`)
            }
        }

        // 构建开始标签
        const hasChildren = childElements.some(({ key, value }) => {
            const tag = TAG_MAP[key]
            if (tag === null) return false
            if (Array.isArray(value)) return value.length > 0
            if (key === 'application') return value != null
            return value != null
        })

        if (attrs.length === 0 && !hasChildren) {
            lines.push(`${pad}<${tagName} />`)
            return
        }

        // 属性输出
        if (attrs.length <= 2) {
            const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
            if (!hasChildren) {
                lines.push(`${pad}<${tagName}${attrStr} />`)
                return
            }
            lines.push(`${pad}<${tagName}${attrStr}>`)
        } else {
            lines.push(`${pad}<${tagName}`)
            attrs.forEach(a => lines.push(`${pad}    ${a}`))
            lines.push(`${pad}    ${hasChildren ? '>' : '/>'}`)
            if (!hasChildren) return
        }

        // 子元素
        for (const { key, value } of childElements) {
            if (key === 'application' && value) {
                renderElement('application', value, indent + 1)
            } else {
                const tag = TAG_MAP[key]
                if (tag === null) continue
                if (!tag) continue

                if (Array.isArray(value)) {
                    for (const item of value) {
                        if (typeof item === 'object' && item !== null) {
                            renderElement(tag, item, indent + 1)
                        }
                    }
                } else if (typeof value === 'object' && value !== null) {
                    renderElement(tag, value, indent + 1)
                }
            }
        }

        lines.push(`${pad}</${tagName}>`)
    }

    // 给 manifest 加上 xmlns
    const xmlManifest = { 'xmlns:android': 'http://schemas.android.com/apk/res/android', ...manifest }
    renderElement('manifest', xmlManifest, 0)

    return lines.join('\n')
}

// Collapsible XML tree node styles
const xmlFont = {
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: '12px',
    lineHeight: '1.8'
}
const tagColor = '#22863a'
const attrNameColor = '#6f42c1'
const attrValColor = '#032f62'
const bracketColor = '#24292e'

// Build XML child elements from a JSON manifest object
function getChildElements(obj) {
    const children = []
    for (const [key, value] of Object.entries(obj)) {
        if (key === 'application' && value && typeof value === 'object') {
            children.push({ tag: 'application', data: value })
        } else if (CHILD_KEYS.has(key)) {
            const tag = TAG_MAP[key]
            if (tag === null || !tag) continue
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (typeof item === 'object' && item !== null) {
                        children.push({ tag, data: item })
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                children.push({ tag, data: value })
            }
        }
    }
    return children
}

// Build attributes from a JSON manifest object
function getAttributes(obj) {
    const attrs = []
    for (const [key, value] of Object.entries(obj)) {
        if (!CHILD_KEYS.has(key) && value !== null && value !== undefined && typeof value !== 'object') {
            attrs.push({ name: formatAttrName(key), value: String(value) })
        }
    }
    return attrs
}

// Render formatted attributes
const XmlAttrs = ({ attrs }) => (
    <>
        {attrs.map((a, i) => (
            <span key={i}>
                {' '}
                <span style={{ color: attrNameColor }}>{a.name}</span>
                <span style={{ color: bracketColor }}>=</span>
                <span style={{ color: attrValColor }}>"{a.value}"</span>
            </span>
        ))}
    </>
)

// Recursive collapsible XML tree node
const XmlTreeNode = ({ tag, data, defaultExpanded = false }) => {
    const [expanded, setExpanded] = useState(defaultExpanded)
    const attrs = getAttributes(data)
    const children = getChildElements(data)
    const hasChildren = children.length > 0

    if (!hasChildren) {
        // Self-closing tag
        return (
            <div style={{ ...xmlFont, paddingLeft: '20px' }}>
                <span style={{ color: bracketColor }}>&lt;</span>
                <span style={{ color: tagColor }}>{tag}</span>
                <XmlAttrs attrs={attrs} />
                <span style={{ color: bracketColor }}> /&gt;</span>
            </div>
        )
    }

    return (
        <div style={{ paddingLeft: '20px' }}>
            {/* Opening tag line */}
            <div
                style={{ ...xmlFont, cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setExpanded(!expanded)}
            >
                <span style={{
                    display: 'inline-block',
                    width: '14px',
                    textAlign: 'center',
                    color: '#999',
                    fontSize: '10px',
                    marginRight: '2px'
                }}>
                    {expanded ? '▼' : '▶'}
                </span>
                <span style={{ color: bracketColor }}>&lt;</span>
                <span style={{ color: tagColor }}>{tag}</span>
                <XmlAttrs attrs={attrs} />
                <span style={{ color: bracketColor }}>&gt;</span>
                {!expanded && (
                    <>
                        <span style={{ color: '#999' }}> ... </span>
                        <span style={{ color: bracketColor }}>&lt;/</span>
                        <span style={{ color: tagColor }}>{tag}</span>
                        <span style={{ color: bracketColor }}>&gt;</span>
                    </>
                )}
            </div>

            {/* Children */}
            {expanded && (
                <>
                    {children.map((child, idx) => (
                        <XmlTreeNode key={idx} tag={child.tag} data={child.data} />
                    ))}
                    <div style={{ ...xmlFont, paddingLeft: '20px' }}>
                        <span style={{ width: '16px', display: 'inline-block' }} />
                        <span style={{ color: bracketColor }}>&lt;/</span>
                        <span style={{ color: tagColor }}>{tag}</span>
                        <span style={{ color: bracketColor }}>&gt;</span>
                    </div>
                </>
            )}
        </div>
    )
}

// Root XML tree component
const XmlTree = ({ manifest }) => {
    const rootData = { 'xmlns:android': 'http://schemas.android.com/apk/res/android', ...manifest }
    return (
        <div style={{ ...xmlFont, overflow: 'auto' }}>
            <div style={{ color: '#6a737d', ...xmlFont }}>&lt;?xml version="1.0" encoding="utf-8"?&gt;</div>
            <XmlTreeNode tag="manifest" data={rootData} defaultExpanded={true} />
        </div>
    )
}


// Component item with AM command copy button
const ComponentItem = ({ name, command, onCopy, onCopyName }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #f5f5f5',
        fontSize: '13px'
    }}>
        <span
            onClick={() => onCopyName(name)}
            title="点击复制组件名"
            style={{
                flex: 1,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                color: '#333',
                wordBreak: 'break-all',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#007bff'}
            onMouseLeave={(e) => e.target.style.color = '#333'}
        >
            {name}
        </span>
        {command && (
            <button
                onClick={() => onCopy(command)}
                title={command}
                style={{
                    marginLeft: '8px',
                    padding: '3px 8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                }}
            >
                复制AM
            </button>
        )}
    </div>
)

// Component section
const ComponentSection = ({ title, items, packageName, commandPrefix, onCopy, onCopyName, emptyText }) => (
    <div style={{ marginBottom: '20px' }}>
        <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
            padding: '8px 0',
            borderBottom: '2px solid #eee',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center'
        }}>
            {title}
            <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal', marginLeft: '8px' }}>({items.length})</span>
        </div>
        {items.length === 0 ? (
            <div style={{ padding: '10px 0', color: '#999', fontSize: '13px', fontStyle: 'italic' }}>{emptyText || '无'}</div>
        ) : (
            items.map((item, idx) => (
                <ComponentItem
                    key={idx}
                    name={item.name}
                    command={commandPrefix ? `${commandPrefix} -n ${packageName}/${item.name}` : null}
                    onCopy={onCopy}
                    onCopyName={onCopyName}
                />
            ))
        )}
    </div>
)

const ApkInfoViewer = ({ apkInfo, fileInfo, onReset }) => {
    const [activeTab, setActiveTab] = useState('basic')
    const [toastMsg, setToastMsg] = useState(null)

    if (!apkInfo) return null

    // Toast Helper
    const showToast = (msg) => {
        setToastMsg(msg)
        setTimeout(() => setToastMsg(null), 2000)
    }

    // --- Styles ---
    const labelStyle = { fontWeight: 'bold', width: '100px', display: 'inline-block', color: '#555', flexShrink: 0 }
    const rowStyle = { marginBottom: '12px', display: 'flex', alignItems: 'flex-start', fontSize: '14px' }
    const valueStyle = { flex: 1, wordBreak: 'break-all', color: '#333', cursor: 'pointer' }
    const sectionStyle = { marginTop: '25px', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#333' }

    const tabStyle = (isActive) => ({
        padding: '10px 20px',
        cursor: 'pointer',
        borderBottom: isActive ? '2px solid #007bff' : '2px solid transparent',
        color: isActive ? '#007bff' : '#666',
        fontWeight: isActive ? 'bold' : 'normal',
        transition: 'all 0.2s',
        userSelect: 'none'
    })

    // --- Data Extraction ---
    const { icon, manifest } = apkInfo
    const label = manifest.application && manifest.application.label
        ? (typeof manifest.application.label === 'string' ? manifest.application.label : '未知应用')
        : '未知应用'
    const packageName = manifest.package
    const versionName = manifest.versionName
    const versionCode = manifest.versionCode
    const minSdk = manifest.usesSdk ? manifest.usesSdk.minSdkVersion : 'N/A'
    const targetSdk = manifest.usesSdk ? manifest.usesSdk.targetSdkVersion : 'N/A'

    // Extract launcher activity
    const launcherActivities = manifest.application?.launcherActivities || []
    const mainActivity = launcherActivities.length > 0 ? launcherActivities[0].name : null
    const amCommand = mainActivity
        ? `am start -n ${packageName}/${mainActivity}`
        : null

    // --- Handlers ---
    const handleCopy = (text) => {
        if (!text) return
        navigator.clipboard.writeText(text).then(() => {
            showToast(`已复制: ${text.length > 20 ? text.substring(0, 20) + '...' : text}`)
        }).catch(err => {
            console.error('Copy failed', err)
            showToast('复制失败')
        })
    }

    const handleCopyAll = () => {
        if (activeTab === 'raw') {
            handleCopy(manifestToXml(manifest))
            showToast('已复制 XML')
            return
        }

        const lines = [
            `应用名称: ${label}`,
            `包名: ${packageName}`,
            `VersionName: ${versionName}`,
            `VersionCode: ${versionCode}`,
            `Min SDK: ${minSdk}`,
            `Target SDK: ${targetSdk}`,
        ]
        if (mainActivity) {
            lines.push(`主Activity: ${mainActivity}`)
            lines.push(`AM启动命令: ${amCommand}`)
        }
        if (fileInfo) {
            lines.push(`文件大小: ${(fileInfo.sizeBytes / 1024).toFixed(2)} KB`)
            lines.push(`MD5: ${fileInfo.md5}`)
            lines.push(`SHA-1: ${fileInfo.sha1}`)
            lines.push(`SHA-256: ${fileInfo.sha256}`)
        }
        handleCopy(lines.join('\n'))
        showToast('已复制所有信息')
    }

    // --- Components ---
    const CopyableText = ({ text, style = {} }) => (
        <span
            onClick={() => handleCopy(text)}
            title="点击复制"
            className="copyable-text"
            style={{ ...valueStyle, ...style, transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#007bff'}
            onMouseLeave={(e) => e.target.style.color = style.color || '#333'}
        >
            {text}
        </span>
    )

    return (
        <div style={{
            width: '640px', // Fixed width based on user request (Raw info size)
            maxWidth: '100%',
            height: 'calc(100vh - 40px)', // Fixed height container
            margin: '0 auto',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden' // Fixed container size
        }}>

            {/* Toast */}
            {toastMsg && (
                <div style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px 20px',
                    borderRadius: '5px', zIndex: 1000, fontSize: '14px', pointerEvents: 'none',
                    animation: 'fadeInOut 2s ease-in-out'
                }}>
                    {toastMsg}
                </div>
            )}

            {/* Header Info (Fixed) */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 0 20px' }}>
                {icon ? (
                    <img src={icon} alt="App Icon" style={{ width: '80px', height: '80px', borderRadius: '15px', marginRight: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '15px', marginRight: '20px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Icon</div>
                )}
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5em' }}>
                        <CopyableText text={label} style={{ fontWeight: 'bold' }} />
                    </h2>
                    <div style={{ color: '#666', fontSize: '0.9em' }}>
                        <CopyableText text={packageName} style={{ color: '#666' }} />
                    </div>
                </div>
                <button onClick={handleCopyAll} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px', height: '36px', whiteSpace: 'nowrap' }}>
                    {activeTab === 'raw' ? '复制 XML' : '一键复制'}
                </button>
                <button onClick={onReset} style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px', height: '36px', whiteSpace: 'nowrap' }}>重新选择</button>
            </div>

            {/* Tabs (Fixed) */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', margin: '20px 20px 0 20px' }}>
                <div onClick={() => setActiveTab('basic')} style={tabStyle(activeTab === 'basic')}>基本信息</div>
                <div onClick={() => setActiveTab('components')} style={tabStyle(activeTab === 'components')}>组件</div>
                <div onClick={() => setActiveTab('raw')} style={tabStyle(activeTab === 'raw')}>原始信息</div>
            </div>

            {/* Content (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {activeTab === 'basic' && (
                    <div>
                        <div style={{ ...sectionStyle, marginTop: 0 }}>基本信息</div>
                        <div style={rowStyle}><span style={labelStyle}>版本名:</span><CopyableText text={versionName} /></div>
                        <div style={rowStyle}><span style={labelStyle}>版本号:</span><CopyableText text={versionCode} /></div>
                        <div style={rowStyle}><span style={labelStyle}>Min SDK:</span><span style={valueStyle}>{minSdk}</span></div>
                        <div style={rowStyle}><span style={labelStyle}>Target SDK:</span><span style={valueStyle}>{targetSdk}</span></div>

                        {fileInfo && (
                            <>
                                <div style={sectionStyle}>文件信息</div>
                                <div style={rowStyle}><span style={labelStyle}>文件大小:</span><span style={valueStyle}>{(fileInfo.sizeBytes / 1024).toFixed(2)} KB</span></div>
                                <div style={rowStyle}><span style={labelStyle}>MD5:</span><CopyableText text={fileInfo.md5} style={{ fontFamily: 'monospace', color: '#d63384' }} /></div>
                                <div style={rowStyle}><span style={labelStyle}>SHA-1:</span><CopyableText text={fileInfo.sha1} style={{ fontFamily: 'monospace', color: '#d63384' }} /></div>
                                <div style={rowStyle}><span style={labelStyle}>SHA-256:</span><CopyableText text={fileInfo.sha256} style={{ fontFamily: 'monospace', color: '#d63384' }} /></div>
                            </>
                        )}

                        <div style={{ marginTop: '30px', textAlign: 'center', color: '#999', fontSize: '0.9em' }}>拖入新文件以查看</div>
                    </div>
                )}

                {activeTab === 'components' && (
                    <div>
                        <ComponentSection
                            title="Activity"
                            items={manifest.application?.activities || []}
                            packageName={packageName}
                            commandPrefix="am start"
                            onCopy={(cmd) => { handleCopy(cmd); showToast('已复制 AM 命令') }}
                            onCopyName={(name) => { handleCopy(name); showToast('已复制: ' + name) }}
                            emptyText="无 Activity"
                        />
                        <ComponentSection
                            title="Service"
                            items={manifest.application?.services || []}
                            packageName={packageName}
                            commandPrefix="am startservice"
                            onCopy={(cmd) => { handleCopy(cmd); showToast('已复制 AM 命令') }}
                            onCopyName={(name) => { handleCopy(name); showToast('已复制: ' + name) }}
                            emptyText="无 Service"
                        />
                        <ComponentSection
                            title="Receiver"
                            items={manifest.application?.receivers || []}
                            packageName={packageName}
                            commandPrefix="am broadcast -a android.intent.action.BOOT_COMPLETED -n"
                            onCopy={(cmd) => { handleCopy(cmd); showToast('已复制 AM 命令') }}
                            onCopyName={(name) => { handleCopy(name); showToast('已复制: ' + name) }}
                            emptyText="无 BroadcastReceiver"
                        />
                        <ComponentSection
                            title="Provider"
                            items={manifest.application?.providers || []}
                            packageName={packageName}
                            commandPrefix={null}
                            onCopy={(cmd) => { handleCopy(cmd); showToast('已复制') }}
                            onCopyName={(name) => { handleCopy(name); showToast('已复制: ' + name) }}
                            emptyText="无 ContentProvider"
                        />
                    </div>
                )}

                {activeTab === 'raw' && (
                    <div style={{ padding: '5px' }}>
                        <XmlTree manifest={manifest} />
                    </div>
                )}
            </div>

        </div>
    )
}

export default ApkInfoViewer
