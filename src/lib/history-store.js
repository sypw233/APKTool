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
  if (existIdx >= 0) {
    list[existIdx] = { ...list[existIdx], ...record, parsedAt: Date.now() }
  } else {
    list.unshift({ ...record, parsedAt: Date.now() })
  }
  const trimmed = list.slice(0, MAX_RECORDS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
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
