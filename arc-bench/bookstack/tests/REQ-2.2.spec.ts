// requirement: REQ-2.2
import { test, expect } from '@playwright/test';
import { text, ACCOUNT, identity, enter, login } from './helpers';

test("REQ-2.2: Log in with remember me", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  await login(page, true);
  await text(page, ACCOUNT.nickname);
});
