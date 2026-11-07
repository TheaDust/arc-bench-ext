import { expect, test, type Browser } from '@playwright/test';
import { expectCloneCopied, expectCredentialLogin, expectDiscussionComment, expectNoActionable, expectOptionSelected, expectText } from '../../arc-bench/github/tests/support/observations';

test('GitHub ordinary value may appear in several visible places', async ({ page }) => {
  await page.setContent('<span hidden>Open</span><h1>Open</h1><span>Open</span>');
  await expectText(page, 'Open', { exact: true });
  await expect(page.getByText('Open', { exact: true }).filter({ visible: true })).toHaveCount(2);
});

test('GitHub exact observation does not accept an incorrect value', async ({ page }) => {
  await page.setContent('<span>Not Open</span><span hidden>Open</span>');
  await expect(expectText(page, 'Open', { exact: true })).rejects.toThrow();
});

test('GitHub presence fix leaves duplicate action controls ambiguous', async ({ page }) => {
  await page.setContent('<button>Sign in</button><button>Sign in</button>');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Sign in', exact: true }).click({ timeout: 200 })).rejects.toThrow(/strict mode/);
});

test('GitHub search phrase can be embedded in a saved content line', async ({ page }) => {
  await page.setContent('<pre>Document search flow</pre>');
  await expectText(page, 'search flow');
  expect(await page.getByText('search flow', { exact: true }).count()).toBe(0);
});

test('GitHub reviewer removal allows retained history and hidden old controls', async ({ page }) => {
  await page.setContent('<aside>Current reviewers: none</aside><button hidden>Remove bob-reviewer</button><article>bob-reviewer was requested and removed</article>');
  await expect(page.getByRole('button', { name: 'Remove bob-reviewer', exact: true }).filter({ visible: true })).toHaveCount(0);
  await expectText(page, 'bob-reviewer was requested and removed', { exact: true });
});

test('GitHub a remaining reviewer request is still observable', async ({ page }) => {
  await page.setContent('<aside>bob-reviewer<button>Remove bob-reviewer</button></aside><article>Request activity</article>');
  await expect(page.getByRole('button', { name: 'Remove bob-reviewer', exact: true })).toHaveCount(1);
});

test('GitHub comment binds its author within the same persisted article', async ({ page }) => {
  await page.setContent('<header>issue-commenter</header><article><p>Audit comment</p><span>issue-commenter</span></article>');
  await expectDiscussionComment(page, 'Audit comment', 'issue-commenter');
});

test('GitHub username elsewhere cannot satisfy wrong comment authorship', async ({ page }) => {
  await page.setContent('<header>issue-commenter</header><article><p>Audit comment</p><span>other-author</span></article>');
  await expect(expectDiscussionComment(page, 'Audit comment', 'issue-commenter')).rejects.toThrow();
});

test('GitHub prohibited action may be absent, hidden or disabled', async ({ page }) => {
  await page.setContent('<button disabled>Change visibility</button>');
  await expectNoActionable(page.getByRole('button', { name: 'Change visibility', exact: true }));
  await page.setContent('<button hidden>Change visibility</button>');
  await expectNoActionable(page.getByRole('button', { name: 'Change visibility', exact: true }));
  await page.setContent('<p>No visibility control</p>');
  await expectNoActionable(page.getByRole('button', { name: 'Change visibility', exact: true }));
});

test('GitHub enabled prohibited operation remains a failure', async ({ page }) => {
  await page.setContent('<button>Change visibility</button>');
  await expect(expectNoActionable(page.getByRole('button', { name: 'Change visibility', exact: true }))).rejects.toThrow();
});

test('GitHub current assignee selection is independent of historical mentions', async ({ page }) => {
  await page.setContent('<div role="option" aria-selected="false">bob-reviewer</div><article>bob-reviewer was assigned then removed</article>');
  const option = page.getByRole('option', { name: 'bob-reviewer', exact: true });
  await expectOptionSelected(option, false);
  await option.evaluate(element => element.setAttribute('aria-selected', 'true'));
  await expectOptionSelected(option, true);
});

test('GitHub a retained selected assignee cannot pass unassignment', async ({ page }) => {
  await page.setContent('<div role="option" aria-selected="true">bob-reviewer</div><article>Removal notification</article>');
  await expect(expectOptionSelected(page.getByRole('option', { name: 'bob-reviewer', exact: true }), false)).rejects.toThrow();
});

test('GitHub member launcher and submit have distinct public operation names', async ({ page }) => {
  await page.setContent('<button>Add member</button><label>Username<input></label><button onclick="document.querySelector(\'p\').textContent=\'bob-reviewer added\'">Add member to team</button><p></p>');
  await page.getByRole('button', { name: 'Add member to team', exact: true }).click();
  await expect(page.getByText('bob-reviewer added', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add member', exact: true })).toBeVisible();
});

test('GitHub current ready action can disappear while Draft history remains', async ({ page }) => {
  await page.setContent('<h1>Draft onboarding update</h1><span>Open</span><article>Created as Draft and marked ready for review</article>');
  await expectText(page, 'Open', { exact: true });
  await expect(page.getByRole('button', { name: 'Ready for review', exact: true })).toHaveCount(0);
  await expectText(page, 'Created as Draft and marked ready for review', { exact: true });
});

test('GitHub clone copy compares actual clipboard with read-only visible address', async ({ page }) => {
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<h1>acme-docs</h1>' }));
  await page.goto('https://github-oracle.test');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://github-oracle.test' });
  await page.setContent('<div role="tab" aria-selected="true">HTTPS</div><label>Clone value<input readonly value="https://example.test/acme-demo/acme-docs.git"></label><button onclick="navigator.clipboard.writeText(document.querySelector(\'input\').value);document.querySelector(\'p\').textContent=\'Copied\'">Copy clone value</button><p></p>');
  await expectCloneCopied(page, 'HTTPS', 'acme-docs');
  await page.setContent('<div role="tab" aria-selected="true">SSH</div><output aria-label="Clone value">git@example.test:acme-demo/acme-docs.git</output><button onclick="navigator.clipboard.writeText(document.querySelector(\'output\').textContent);document.querySelector(\'p\').textContent=\'Copied\'">Copy clone value</button><p></p>');
  await expectCloneCopied(page, 'SSH', 'acme-docs');
});

test('GitHub feedback-only clone button cannot fake clipboard copying', async ({ page }) => {
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<h1>acme-docs</h1>' }));
  await page.goto('https://github-oracle.test');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://github-oracle.test' });
  await page.setContent('<div role="tab" aria-selected="true">HTTPS</div><output aria-label="Clone value">https://example.test/acme-demo/acme-docs.git</output><button onclick="document.querySelector(\'p\').textContent=\'Copied\'">Copy clone value</button><p></p>');
  await expect(expectCloneCopied(page, 'HTTPS', 'acme-docs')).rejects.toThrow();
});

test('GitHub credential check starts fresh despite retained localStorage authentication', async ({ browser, page }) => {
  const html = `<!doctype html><body>
    <a href="/login">Sign in</a>
    <label>Username or email<input aria-label="Username or email"></label>
    <label>Password<input type="password" aria-label="Password"></label>
    <button>Sign in</button><script>
    const user = localStorage.getItem('user');
    if (user) document.body.innerHTML='<h1>'+user+'</h1>';
    else document.querySelector('button').onclick=()=>{document.body.innerHTML='<h1>audit-user</h1>';};
    </script></body>`;
  await page.route('**/*', route => route.fulfill({ body: html, contentType: 'text/html' }));
  await page.goto('https://github-oracle.test');
  await page.evaluate(() => localStorage.setItem('user', 'already-signed-in'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'already-signed-in', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toHaveCount(0);
  let opened = 0;
  let closed = false;
  const routedBrowser = {
    newContext: async () => {
      opened++;
      const context = await browser.newContext();
      context.on('close', () => { closed = true; });
      await context.route('**/*', route => route.fulfill({ body: html, contentType: 'text/html' }));
      return context;
    },
  } as Browser;
  await expectCredentialLogin(routedBrowser, { username: 'audit-user', email: 'audit-user@example.test', password: 'Valid-password-123!' });
  expect(opened).toBe(1);
  expect(closed).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('user'))).toBe('already-signed-in');
});
