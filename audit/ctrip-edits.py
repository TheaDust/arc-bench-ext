from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TASK = ROOT / 'arc-bench' / 'ctrip' / 'tests'

def edit(name, old, new):
    p = TASK / name
    s = p.read_text(encoding='utf-8')
    assert old in s, (name, old)
    p.write_text(s.replace(old, new), encoding='utf-8', newline='\n')

edit('helpers.ts', "export const action = (s: Scope, name: string) => button(s, name).or(s.getByRole('link', { name, exact: true }));",
"""export const action = (s: Scope, name: string) => button(s, name).or(s.getByRole('link', { name, exact: true }));
// These account entries have no declared control role; retain exact identity and strict uniqueness.
export const accountEntry = (s: Scope, name: 'Orders' | 'Personal center') => action(s, name)
  .or(s.getByRole('menuitem', { name, exact: true }));

export async function expectFeeAbsent(page: Page, fee: string) {
  const details = region(page, 'Fee details');
  await expect(details).toBeVisible();
  await expect(details.getByText(fee, { exact: true }).filter({ visible: true })).toHaveCount(0);
}""")
edit('helpers.ts', "await page.getByRole('link', { name: 'Orders', exact: true }).click();", "await accountEntry(page, 'Orders').click();")
edit('helpers.ts', "await page.getByRole('link', { name: 'Personal center', exact: true }).click();", "await accountEntry(page, 'Personal center').click();")
edit('REQ-4.1.spec.ts', 'button, region, visible', 'button, accountEntry, region, visible')
edit('REQ-4.1.spec.ts', "await visible(page.getByRole('menu').filter({ has: page.getByRole('link', { name: 'Orders', exact: true }) }));\n  await page.getByRole('link', { name: 'Orders', exact: true }).click();", "await visible(accountEntry(page, 'Orders'));\n  await accountEntry(page, 'Orders').click();")
edit('REQ-5.1.spec.ts', 'button, visible', 'button, accountEntry, visible')
edit('REQ-5.1.spec.ts', "await visible(page.getByRole('menu').filter({ has: page.getByRole('link', { name: 'Personal center', exact: true }) }));\n  await page.getByRole('link', { name: 'Personal center', exact: true }).click();", "await visible(accountEntry(page, 'Personal center'));\n  await accountEntry(page, 'Personal center').click();")

for name, fee in [('REQ-3.13.spec.ts', 'Extra 10 kg: ¥60'), ('REQ-3.14.spec.ts', 'Airport drop-off: ¥42'), ('REQ-3.15.spec.ts', 'Tianfu T2 lounge: ¥80')]:
    edit(name, 'region, checkbox,', 'region, expectFeeAbsent, checkbox,')
    edit(name, f"await expect(region(page, 'Fee details').getByText('{fee}', {{ exact: true }})).toHaveCount(0);", f"await expectFeeAbsent(page, '{fee}');")

edit('REQ-2.3.spec.ts', "await textVisible(page, '¥460');", "await expect(button(page, '2026-07-21')).toContainText('¥460');")
edit('REQ-2.16.spec.ts', "await expect(region(page, 'Flight list').getByRole('listitem')).toHaveCount(1);", "await expect(region(page, 'Flight list').getByRole('listitem')).toHaveCount(1);\n  await visible(flight(page, 'CZ3401'));")
edit('REQ-4.7.spec.ts', 'record, records, openHome', 'record, records, visible, openHome')
edit('REQ-4.7.spec.ts', "await tab(page, 'All orders').click();", "await tab(page, 'All orders').click();\n  await visible(region(page, 'Order list'));")
for name, label in [('REQ-5.17.spec.ts', 'Contact list'), ('REQ-5.18.spec.ts', 'Invoice title list')]:
    edit(name, 'record, records, openHome', 'record, records, visible, openHome')
    target = "Search contacts" if label == 'Contact list' else 'Search'
    edit(name, f"await button(page, '{target}').click();", f"await button(page, '{target}').click();\n  await visible(region(page, '{label}'));")
edit('REQ-6.4.spec.ts', "await field(page, 'Password').fill('NewTravel1234!');\n  await button(page, 'Log in').click();", "await field(page, 'Password').fill('NewTravel1234!');\n  await checkbox(page, 'Agree to terms').check();\n  await button(page, 'Log in').click();")
edit('REQ-7.4.spec.ts', 'action, region,', 'action, field, region,')
edit('REQ-7.4.spec.ts', "for (const value of ['JD5162', 'Chengdu', 'Guangzhou']) await textVisible(region(page, 'Flight details'), value);", "for (const value of ['JD5162', 'Chengdu', 'Guangzhou']) await textVisible(region(page, 'Flight details'), value);\n  await expect(field(page, 'Departure date')).toHaveValue('2026-07-21');")
edit('REQ-7.6.spec.ts', "await radio(page, 'Flight number').check();", "await expect(region(page, 'Flight status results')).not.toBeVisible();\n  await expect(region(page, 'Flight details')).not.toBeVisible();\n  await radio(page, 'Flight number').check();")
edit('REQ-8.2.spec.ts', "toContainText('365')", "toContainText(/\\b365[\\s-]*days?\\b/i)")

print('Ctrip bounded edits applied')
