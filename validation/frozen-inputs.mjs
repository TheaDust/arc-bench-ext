import { createHash } from 'node:crypto';
import { extname } from 'node:path';

const textExtensions = new Set(['.cjs', '.csv', '.js', '.json', '.md', '.mjs', '.patch', '.ps1', '.py',
  '.sh', '.svg', '.ts', '.txt', '.yaml', '.yml']);
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function canonicalBytes(path, bytes) {
  if (!textExtensions.has(extname(path))) return bytes;
  const text = bytes.toString('utf8');
  // A text suffix alone must never make an invalid UTF-8 file comparable as text.
  return Buffer.from(text).equals(bytes) ? Buffer.from(text.replaceAll('\r\n', '\n')) : bytes;
}

export function matchesFrozenHash(path, bytes, expected) {
  return sha256(bytes) === expected || sha256(canonicalBytes(path, bytes)) === expected;
}
