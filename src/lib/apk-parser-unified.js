import JSZip from 'jszip'
import { AndroidAppParser } from '@seayoo-web/app-info'
import ApkParser from 'app-info-parser/src/apk'

function enumerateFiles (zip) {
  const files = []
  zip.forEach((path, entry) => {
    if (!entry.dir) {
      files.push({
        path,
        name: path.split('/').pop(),
        size: entry._data ? entry._data.uncompressedSize : 0,
        compressedSize: entry._data ? entry._data.compressedSize : 0
      })
    }
  })
  return files.sort((a, b) => a.path.localeCompare(b.path))
}

function findABIs (zip) {
  const abis = new Set()
  Object.keys(zip.files).forEach(path => {
    if (path.startsWith('lib/') && path.split('/').length >= 3) {
      const abi = path.split('/')[1]
      if (abi) abis.add(abi)
    }
  })
  return Array.from(abis)
}

function getNativeLibs (zip, abis) {
  const result = {}
  for (const abi of abis) {
    const prefix = `lib/${abi}/`
    result[abi] = Object.keys(zip.files)
      .filter(p => p.startsWith(prefix) && !zip.files[p].dir)
      .map(p => ({
        name: p.replace(prefix, ''),
        path: p,
        size: zip.files[p]._data ? zip.files[p]._data.uncompressedSize : 0
      }))
  }
  return result
}

function manifestDomToXml (node, indent) {
  if (!node) return ''
  const pad = '  '.repeat(indent)
  const tag = node.nodeName
  const attrs = (node.attributes || []).map(a => {
    const ns = a.namespaceURI ? 'android:' : ''
    const val = a.typedValue && a.typedValue.value !== null && a.typedValue.value !== undefined
      ? String(a.typedValue.value)
      : (a.value || '')
    return `${ns}${a.name}="${escapeXml(val)}"`
  })

  const children = node.childNodes || []
  if (children.length === 0) {
    return `${pad}<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''} />\n`
  }

  let xml = `${pad}<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>\n`
  for (const child of children) {
    xml += manifestDomToXml(child, indent + 1)
  }
  xml += `${pad}</${tag}>\n`
  return xml
}

function escapeXml (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function generateManifestXml (zip) {
  try {
    const manifestEntry = zip.file(/AndroidManifest\.xml$/i)[0]
    if (!manifestEntry) return ''
    const buffer = await manifestEntry.async('arraybuffer')
    const { default: BinaryXmlParser } = await import('app-info-parser/src/xml-parser/binary')
    const parser = new BinaryXmlParser(Buffer.from(buffer))
    const dom = parser.parse()
    return manifestDomToXml(dom, 0)
  } catch (e) {
    console.warn('XML generation failed:', e)
    return ''
  }
}

function resolveLabel (rawLabel) {
  if (!rawLabel) return null
  if (Array.isArray(rawLabel)) {
    return rawLabel.find(
      l => typeof l === 'string' && l.length > 0 && !l.startsWith('resourceId:')
    ) || null
  }
  if (typeof rawLabel === 'string' && rawLabel.length > 0 && !rawLabel.startsWith('resourceId:')) {
    return rawLabel
  }
  return null
}

export async function parseApk (file) {
  const arrayBuffer = await file.arrayBuffer()

  const zip = await JSZip.loadAsync(arrayBuffer)
  const allFiles = enumerateFiles(zip)
  const supportedABIs = findABIs(zip)
  const nativeLibs = getNativeLibs(zip, supportedABIs)

  const parser = new AndroidAppParser(file)
  const result = await parser.parse()
  if (result instanceof Error) throw result

  let resolvedLabel = null
  try {
    const nameParser = new ApkParser(file)
    const nameResult = await nameParser.parse()
    resolvedLabel = resolveLabel(nameResult?.application?.label)
  } catch (e) {
    console.warn('Label resolution failed:', e)
  }

  const manifest = result.manifest || result
  if (resolvedLabel && manifest.application) {
    manifest.application.label = resolvedLabel
  }

  const xml = await generateManifestXml(zip)

  const basicInfo = {
    packageName: manifest.package || '',
    versionCode: manifest.versionCode || '',
    versionName: manifest.versionName || '',
    appName: manifest.application?.label || '',
    minSdk: manifest.usesSdk?.minSdkVersion || '',
    targetSdk: manifest.usesSdk?.targetSdkVersion || '',
    icon: result.icon || null
  }

  const components = {
    activities: manifest.application?.activities || [],
    services: manifest.application?.services || [],
    receivers: manifest.application?.receivers || [],
    providers: manifest.application?.providers || []
  }

  return {
    basicInfo,
    components,
    permissions: manifest.permissions || [],
    usesPermissions: manifest.usesPermissions || [],
    usesFeatures: manifest.usesFeatures || [],
    usesSdk: manifest.usesSdk || null,
    xml,
    manifest,
    nativeLibs,
    supportedABIs,
    files: allFiles
  }
}
