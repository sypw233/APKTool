/* global localStorage */
const STORAGE_KEY = 'apk-tool-history'
const MAX_RECORDS = 20

export function getHistory () {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

export function saveHistory (record) {
  const list = getHistory()
  const existIdx = list.findIndex(
    r => r.packageName === record.packageName && r.versionCode === record.versionCode
  )
  const entry = {
    id: record.id || Date.now(),
    packageName: record.packageName,
    appName: record.appName,
    versionName: record.versionName,
    versionCode: record.versionCode,
    icon: record.icon,
    fileSize: record.fileSize,
    md5: record.md5,
    filePath: record.filePath,
    parsedAt: Date.now(),
    apkInfo: record.apkInfo,
    fileInfo: record.fileInfo,
    apkFiles: record.apkFiles
  }
  if (existIdx >= 0) {
    list[existIdx] = entry
  } else {
    list.unshift(entry)
  }
  const trimmed = list.slice(0, MAX_RECORDS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (e) {
    // localStorage 空间不足时，逐条清理旧记录重试
    for (let i = trimmed.length - 1; i >= 1; i--) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed.slice(0, i)))
        return trimmed.slice(0, i)
      } catch (_) { /* continue */ }
    }
  }
  return trimmed
}

export function removeHistory (id) {
  const list = getHistory().filter(r => r.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return list
}

export function clearHistory () {
  localStorage.removeItem(STORAGE_KEY)
  return []
}
