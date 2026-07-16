/* global self */
import { Buffer } from 'buffer'
import { computeHashes, parseApkFromArrayBuffer } from './apk-parser-unified'

globalThis.Buffer = Buffer
globalThis.window = self

self.onmessage = async function (e) {
  const { type, arrayBuffer, fileName, fileSize, filePath } = e.data

  if (type !== 'parse') return

  try {
    self.postMessage({ type: 'progress', stage: 'hash' })
    const hashes = await computeHashes(arrayBuffer)

    const fileInfo = {
      name: fileName,
      sizeBytes: fileSize,
      lastModified: new Date().toLocaleString(),
      sha1: hashes.sha1,
      sha256: hashes.sha256,
      md5: hashes.md5
    }

    const apkInfo = await parseApkFromArrayBuffer(arrayBuffer, fileName, (stage) => {
      self.postMessage({ type: 'progress', stage })
    })

    const apkFiles = {
      files: apkInfo.files,
      nativeLibs: apkInfo.nativeLibs,
      supportedABIs: apkInfo.supportedABIs
    }

    self.postMessage({
      type: 'result',
      data: { apkInfo, fileInfo, apkFiles, hashes, filePath }
    })
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || '未知错误' })
  }
}
