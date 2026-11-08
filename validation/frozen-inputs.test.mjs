import { strict as assert } from 'node:assert';
import test from 'node:test';
import { matchesFrozenHash, sha256 } from './frozen-inputs.mjs';

test('a checkout may convert LF to CRLF only for unchanged UTF-8 text', () => {
  const hash = sha256(Buffer.from('第一行\nsecond\n'));
  assert.ok(matchesFrozenHash('requirement.yaml', Buffer.from('第一行\r\nsecond\r\n'), hash));
  assert.ok(!matchesFrozenHash('requirement.yaml', Buffer.from('第一行\r\nchanged\r\n'), hash));
  assert.ok(!matchesFrozenHash('reference.png', Buffer.from('第一行\r\nsecond\r\n'), hash));
  const invalidUtf8 = Buffer.from([0xff, 0x0d, 0x0a]);
  assert.ok(!matchesFrozenHash('file.ts', invalidUtf8, sha256(Buffer.from('\ufffd\n'))));
});
