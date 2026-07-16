const OID_MAP = {
  '2.5.4.3': 'CN',
  '2.5.4.4': 'SN',
  '2.5.4.5': 'serialNumber',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.9': 'streetAddress',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.12': 'title',
  '2.5.4.42': 'GN',
  '2.5.4.46': 'dnQualifier',
  '0.9.2342.19200300.100.1.25': 'DC',
  '1.2.840.113549.1.9.1': 'emailAddress'
}

const SIG_ALG_MAP = {
  '1.2.840.113549.1.1.4': 'MD5withRSA',
  '1.2.840.113549.1.1.5': 'SHA1withRSA',
  '1.2.840.113549.1.1.11': 'SHA256withRSA',
  '1.2.840.113549.1.1.12': 'SHA384withRSA',
  '1.2.840.113549.1.1.13': 'SHA512withRSA',
  '1.2.840.113549.1.1.14': 'SHA224withRSA',
  '1.2.840.10045.4.1': 'ECDSA-SHA1',
  '1.2.840.10045.4.3.1': 'ECDSA-SHA224',
  '1.2.840.10045.4.3.2': 'ECDSA-SHA256',
  '1.2.840.10045.4.3.3': 'ECDSA-SHA384',
  '1.2.840.10045.4.3.4': 'ECDSA-SHA512',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448'
}

const PUB_KEY_ALG_MAP = {
  '1.2.840.113549.1.1.1': 'RSA',
  '1.2.840.10045.2.1': 'EC',
  '1.2.840.113549.1.1.10': 'RSA-PSS',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448'
}

function readTag (buf, offset) {
  if (offset >= buf.length) return null
  const tag = buf[offset]
  let pos = offset + 1
  let length = buf[pos]
  pos++
  if (length & 0x80) {
    const numBytes = length & 0x7f
    length = 0
    for (let i = 0; i < numBytes; i++) {
      length = length * 256 + buf[pos]
      pos++
    }
  }
  return { tag, length, offset: pos }
}

function readOid (buf, offset, length) {
  const end = offset + length
  const parts = []
  const first = buf[offset]
  parts.push(Math.floor(first / 40))
  parts.push(first % 40)
  let value = 0
  for (let i = offset + 1; i < end; i++) {
    value = value * 128 + (buf[i] & 0x7f)
    if ((buf[i] & 0x80) === 0) {
      parts.push(value)
      value = 0
    }
  }
  return parts.join('.')
}

function readString (buf, offset, length) {
  const bytes = buf.slice(offset, offset + length)
  return new TextDecoder().decode(bytes)
}

function readInteger (buf, offset, length) {
  let hex = ''
  for (let i = offset; i < offset + length; i++) {
    hex += buf[i].toString(16).padStart(2, '0')
  }
  return hex
}

function readTime (buf, offset, length, tag) {
  const str = readString(buf, offset, length)
  if (tag === 0x17) {
    const y = parseInt(str.substring(0, 2))
    const year = (y >= 50 ? 1900 : 2000) + y
    return `${year}-${str.substring(2, 4)}-${str.substring(4, 6)} ${str.substring(6, 8)}:${str.substring(8, 10)}:${str.substring(10, 12)} UTC`
  }
  return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)} ${str.substring(8, 10)}:${str.substring(10, 12)}:${str.substring(12, 14)} UTC`
}

function parseName (buf, offset, length) {
  const end = offset + length
  const parts = []
  let pos = offset
  while (pos < end) {
    const rdn = readTag(buf, pos)
    if (!rdn) break
    const rdnEnd = rdn.offset + rdn.length
    let innerPos = rdn.offset
    while (innerPos < rdnEnd) {
      const atv = readTag(buf, innerPos)
      if (!atv) break
      const typeTag = readTag(buf, atv.offset)
      if (typeTag && typeTag.tag === 0x06) {
        const oid = readOid(buf, typeTag.offset, typeTag.length)
        const valTag = readTag(buf, typeTag.offset + typeTag.length)
        if (valTag) {
          const val = readString(buf, valTag.offset, valTag.length)
          const key = OID_MAP[oid] || oid
          parts.push({ key, value: val })
        }
      }
      innerPos = atv.offset + atv.length
    }
    pos = rdnEnd
  }
  return parts
}

function nameToString (parts) {
  return parts.map(p => `${p.key}=${p.value}`).join(', ')
}

function findCertInPkcs7 (buf) {
  const outer = readTag(buf, 0)
  if (!outer || outer.tag !== 0x30) return null

  const contentType = readTag(buf, outer.offset)
  if (!contentType || contentType.tag !== 0x06) return null

  const pos = contentType.offset + contentType.length

  const contentWrapper = readTag(buf, pos)
  if (!contentWrapper) return null

  const signedData = readTag(buf, contentWrapper.offset)
  if (!signedData || signedData.tag !== 0x30) return null

  let sdPos = signedData.offset

  const versionTag = readTag(buf, sdPos)
  if (!versionTag) return null
  sdPos = versionTag.offset + versionTag.length

  const digestAlgs = readTag(buf, sdPos)
  if (!digestAlgs) return null
  sdPos = digestAlgs.offset + digestAlgs.length

  const encapContent = readTag(buf, sdPos)
  if (!encapContent) return null
  sdPos = encapContent.offset + encapContent.length

  if (sdPos >= signedData.offset + signedData.length) return null

  const nextTag = readTag(buf, sdPos)
  if (!nextTag) return null

  if (nextTag.tag === 0xa0) {
    const certTag = readTag(buf, nextTag.offset)
    if (certTag && certTag.tag === 0x30) {
      return { offset: nextTag.offset, length: nextTag.length }
    }
  }

  return null
}

function parseTbsCertificate (buf, offset, length) {
  const end = offset + length
  let pos = offset

  const first = readTag(buf, pos)
  if (!first) return null

  if (first.tag === 0xa0) {
    pos = first.offset + first.length
  }

  const serialTag = readTag(buf, pos)
  if (!serialTag) return null
  const serialNumber = readInteger(buf, serialTag.offset, serialTag.length)
  pos = serialTag.offset + serialTag.length

  const sigAlg = readTag(buf, pos)
  if (!sigAlg) return null
  const sigAlgOid = readTag(buf, sigAlg.offset)
  const sigAlgOidStr = sigAlgOid && sigAlgOid.tag === 0x06 ? readOid(buf, sigAlgOid.offset, sigAlgOid.length) : ''
  pos = sigAlg.offset + sigAlg.length

  const issuerTag = readTag(buf, pos)
  if (!issuerTag) return null
  const issuer = parseName(buf, issuerTag.offset, issuerTag.length)
  pos = issuerTag.offset + issuerTag.length

  const validityTag = readTag(buf, pos)
  if (!validityTag) return null
  const vEnd = validityTag.offset + validityTag.length
  let vPos = validityTag.offset

  const notBeforeTag = readTag(buf, vPos)
  vPos = notBeforeTag.offset + notBeforeTag.length
  const notBefore = readTime(buf, notBeforeTag.offset, notBeforeTag.length, notBeforeTag.tag)

  const notAfterTag = readTag(buf, vPos)
  const notAfter = readTime(buf, notAfterTag.offset, notAfterTag.length, notAfterTag.tag)
  pos = vEnd

  const subjectTag = readTag(buf, pos)
  if (!subjectTag) return null
  const subject = parseName(buf, subjectTag.offset, subjectTag.length)
  pos = subjectTag.offset + subjectTag.length

  let publicKeyAlg = ''
  let keySize = 0
  if (pos < end) {
    const spkiTag = readTag(buf, pos)
    if (spkiTag && spkiTag.tag === 0x30) {
      const algIdTag = readTag(buf, spkiTag.offset)
      if (algIdTag && algIdTag.tag === 0x30) {
        const algOidTag = readTag(buf, algIdTag.offset)
        if (algOidTag && algOidTag.tag === 0x06) {
          const algOid = readOid(buf, algOidTag.offset, algOidTag.length)
          publicKeyAlg = PUB_KEY_ALG_MAP[algOid] || algOid
        }
      }
      const bitStrTag = readTag(buf, algIdTag.offset + algIdTag.length)
      if (bitStrTag && bitStrTag.tag === 0x03) {
        const unusedBits = buf[bitStrTag.offset]
        keySize = (bitStrTag.length - 1 - unusedBits) * 8
        if (publicKeyAlg === 'RSA' && keySize > 0) {
          const keySeq = readTag(buf, bitStrTag.offset + 1)
          if (keySeq && keySeq.tag === 0x30) {
            const modulusTag = readTag(buf, keySeq.offset)
            if (modulusTag && modulusTag.tag === 0x02) {
              const firstByte = buf[modulusTag.offset]
              const modLen = firstByte === 0 ? modulusTag.length - 1 : modulusTag.length
              keySize = modLen * 8
            }
          }
        }
      }
    }
  }

  return {
    serialNumber,
    sigAlgOid: sigAlgOidStr,
    issuer,
    subject,
    notBefore,
    notAfter,
    publicKeyAlg,
    keySize
  }
}

async function computeFingerprint (arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join(':')
}

export async function parseCert (arrayBuffer) {
  const buf = new Uint8Array(arrayBuffer)

  if (buf.length < 4 || buf[0] !== 0x30) {
    throw new Error('不是有效的证书文件')
  }

  let certOffset = 0
  let certLength = buf.length

  const firstTag = readTag(buf, 0)
  if (firstTag && firstTag.tag === 0x30) {
    const innerOid = readTag(buf, firstTag.offset)
    if (innerOid && innerOid.tag === 0x06) {
      const oid = readOid(buf, innerOid.offset, innerOid.length)
      if (oid === '1.2.840.113549.1.7.2') {
        const certRange = findCertInPkcs7(buf)
        if (certRange) {
          certOffset = certRange.offset
          certLength = certRange.length
        }
      }
    }
  }

  const certBuf = buf.slice(certOffset, certOffset + certLength)
  const certTag = readTag(certBuf, 0)
  if (!certTag || certTag.tag !== 0x30) {
    throw new Error('无法解析证书结构')
  }

  const tbsTag = readTag(certBuf, certTag.offset)
  if (!tbsTag || tbsTag.tag !== 0x30) {
    throw new Error('无法解析 TBS 证书')
  }

  const tbs = parseTbsCertificate(certBuf, tbsTag.offset, tbsTag.length)
  if (!tbs) {
    throw new Error('无法解析证书字段')
  }

  const fingerprint = await computeFingerprint(certBuf)

  return {
    subject: nameToString(tbs.subject),
    issuer: nameToString(tbs.issuer),
    serialNumber: tbs.serialNumber,
    validNotBefore: tbs.notBefore,
    validNotAfter: tbs.notAfter,
    signatureAlgorithm: SIG_ALG_MAP[tbs.sigAlgOid] || tbs.sigAlgOid,
    publicKeyAlgorithm: tbs.publicKeyAlg,
    keySize: tbs.keySize,
    fingerprint
  }
}
