import { expect, selectors, test, type Locator, type Page } from '@playwright/test';

export type Scope = Page | Locator;
export type LiveRegionRole = 'status' | 'alert';

// Both standalone task copies can be imported by the same contract suite.
const registration = Symbol.for('arc-bench.visible-message');
const registrations = globalThis as typeof globalThis & { [registration]?: Promise<void> };
test.beforeAll(async () => {
  await (registrations[registration] ??= selectors.register('arcVisibleMessage', () => {
    const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
    const excluded = 'button, input, select, textarea, [role="button"], [role="menuitem"], script, style, template';
    const hidden = '[hidden], [inert], [aria-hidden="true" i]';

    function messageText(element: Element): string {
      if (element.closest(hidden)) return '';
      if (element.matches(excluded)) return '\n';
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return '';
      let text = '';
      for (const child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          const range = element.ownerDocument.createRange();
          range.selectNodeContents(child);
          if ([...range.getClientRects()].some(rect => rect.width > 0 && rect.height > 0)) {
            text += (child.textContent ?? '').replace(/\s+/g, ' ');
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const value = messageText(child as Element);
          const block = /^(block|flex|grid|flow-root|list-item|table)/.test(getComputedStyle(child as Element).display);
          text += block ? `\n${value}\n` : value;
        }
      }
      return text;
    }

    function queryAll(root: Document | ShadowRoot | Element, selector: string): Element[] {
      const message = normalize(JSON.parse(selector));
      const elements = [...root.querySelectorAll('*')];
      if (root.nodeType === Node.ELEMENT_NODE) elements.unshift(root as Element);
      const matches = elements.filter(element => {
        if (element.closest(excluded)) return false;
        // Inline fragments are part of their surrounding message, not separate messages.
        const display = getComputedStyle(element).display;
        if (element !== root && /^(inline|contents)/.test(display)
          && !element.matches('[role="status"], [role="alert"]')) return false;
        const text = messageText(element);
        return normalize(text) === message || text.split('\n').some(line => normalize(line) === message);
      });
      return matches.filter(element => !matches.some(other => other !== element && element.contains(other)));
    }

    return {
      query: (root: Document | ShadowRoot | Element, selector: string) => queryAll(root, selector)[0] ?? null,
      queryAll,
    };
  }, { contentScript: true }));
});

/** Match complete visible, accessible message text across inline markup. */
export function visibleMessage(scope: Scope, message: string): Locator {
  return scope.locator(`arcVisibleMessage=${JSON.stringify(message)}`);
}

/** A live region containing the exact visible message. */
export function liveRegion(scope: Scope, role: LiveRegionRole, message: string): Locator {
  const page = 'page' in scope ? scope.page() : scope;
  return scope.getByRole(role).filter({ has: visibleMessage(page, message) });
}

export const notice = (scope: Scope, message: string) => liveRegion(scope, 'status', message);
export const alertMessage = (scope: Scope, message: string) => liveRegion(scope, 'alert', message);

/** Presence permits repeated feedback; actions still require a unique target. */
export async function expectLiveMessage(scope: Scope, role: LiveRegionRole, message: string): Promise<Locator> {
  const region = liveRegion(scope, role, message);
  await expect(region).not.toHaveCount(0);
  await expect(region.first()).toBeVisible();
  return region;
}

export const expectNotice = (scope: Scope, message: string) => expectLiveMessage(scope, 'status', message);
export const expectAlert = (scope: Scope, message: string) => expectLiveMessage(scope, 'alert', message);

/** Reopen saved URLs with a document load, including same-document hash routes. */
export async function openUrl(page: Page, url: string): Promise<void> {
  const current = new URL(page.url());
  const target = new URL(url, current);
  const sameDocument = current.origin === target.origin
    && current.pathname === target.pathname
    && current.search === target.search;
  if (!sameDocument) {
    await page.goto(target.href);
    return;
  }
  if (current.hash !== target.hash) await page.goto(target.href);
  await page.reload();
}

export async function reopen(page: Page): Promise<void> {
  await page.reload();
}
