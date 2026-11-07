import { expect, type Locator, type Page } from '@playwright/test';

export type Scope = Page | Locator;

/** A native password input has no implicit textbox role; its exact label still identifies it. */
export function formField(scope: Scope, name: string, role: 'textbox' | 'combobox' = 'textbox'): Locator {
  const declared = scope.getByRole(role, { name, exact: true });
  if (role !== 'textbox' || !/password/i.test(name)) return declared;
  return declared.or(scope.getByLabel(name, { exact: true }).and(scope.locator('input[type="password"]')));
}

async function nativeSelect(control: Locator): Promise<boolean> {
  await expect(control).toHaveCount(1);
  await expect(control).toBeVisible();
  await expect(control).toHaveRole('combobox');
  return control.evaluate(element => element.tagName === 'SELECT');
}

async function optionsFor(control: Locator): Promise<Locator> {
  const ids = (await control.getAttribute('aria-controls'))?.trim().split(/\s+/).filter(Boolean);
  if (ids?.length) {
    const roots = control.page().locator(ids.map(id => `[id=${JSON.stringify(id)}]`).join(','));
    return roots.getByRole('option').filter({ visible: true });
  }
  // A portal without aria-controls must still have one unambiguous visible option identity.
  return control.page().getByRole('option').filter({ visible: true });
}

export async function selectChoice(control: Locator, selection: { label: string | RegExp }): Promise<void> {
  const label = selection.label;
  if (await nativeSelect(control)) {
    const labels = await control.locator('option').evaluateAll(options =>
      options.filter(element => {
        const option = element as HTMLOptionElement;
        return !option.hidden && !option.disabled && getComputedStyle(option).display !== 'none'
          && !(option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled);
      }).map(option => (option as HTMLOptionElement).label));
    const matching = labels.filter(value => typeof label === 'string' ? value === label : label.test(value));
    expect(matching, 'One native option must have the requested visible label').toHaveLength(1);
    await control.selectOption({ label: matching[0] });
  } else {
    await control.click();
    const options = await optionsFor(control);
    const selected = options.and(control.page().getByRole('option', { name: label, exact: true }));
    await expect(selected).toHaveCount(1);
    await selected.click();
  }
}

export async function expectSelectedChoice(control: Locator, label: string): Promise<void> {
  if (await nativeSelect(control)) {
    await expect.poll(() => control.evaluate(element =>
      Array.from((element as HTMLSelectElement).selectedOptions, option => option.label))).toEqual([label]);
  } else {
    await expect.poll(() => control.evaluate(element =>
      element instanceof HTMLInputElement ? element.value : (element.textContent ?? '').trim())).toBe(label);
  }
}

export async function expectChoiceLabels(control: Locator, labels: string[]): Promise<void> {
  if (await nativeSelect(control)) {
    await expect.poll(() => control.locator('option').evaluateAll(options =>
      options.filter(option => !(option as HTMLOptionElement).hidden && getComputedStyle(option).display !== 'none')
        .map(option => (option as HTMLOptionElement).label))).toEqual(labels);
  } else {
    await control.click();
    await expect(await optionsFor(control)).toHaveText(labels);
    await control.press('Escape');
  }
}

/** Presence checks allow repeated visible copies; action controls remain strictly unique. */
export async function expectVisibleText(scope: Scope, value: string): Promise<void> {
  await expect.poll(() => scope.getByText(value, { exact: true }).filter({ visible: true }).count()).toBeGreaterThan(0);
}
