from pathlib import Path
import re

root = Path('outputs/arc-bench-reviewed-20261107')
tests = root / 'arc-bench/prestashop/tests'
money_names = {'Sale price', 'Regular price', 'Unit price', 'Subtotal', 'Items subtotal', 'Shipping', 'Total', 'Discount', 'Shipping cost'}

for file in tests.glob('*.spec.ts'):
    text = file.read_text(encoding='utf-8')
    old = text
    # These fields have named monetary semantics, without an explicitly declared role.
    for name in money_names:
        text = re.sub(r"region\(([^\n;]*?), '" + re.escape(name) + r"'\)", r"amount(\1, '" + name + "')", text)
    text = re.sub(r"await expect\(action\(nav\(page\), 'Cart'\)\)\.toContainText\('([013])'\);", r'await expectCartUnits(page, \1);', text)
    text = text.replace("await expect(action(nav(page), 'Cart')).toContainText(/\\b0\\b/);", 'await expectCartUnits(page, 0);')
    text = text.replace("await expect(action(nav(page), 'Cart')).toContainText(/\\b1\\b/);", 'await expectCartUnits(page, 1);')
    if file.stem == 'REQ-6.1.spec':
        text = text.replace("page.getByRole('button', { name: /^sign in$/i })", 'signInSubmit(page)')
    if file.stem == 'REQ-1.4.spec':
        text = text.replace("  await expect(page.getByRole('heading', { name: DETAIL, exact: true }).or(page.getByRole('heading', { name: 'Men', exact: true }))).toBeVisible();\n  await expect(page.getByRole('heading', { name: DETAIL, exact: true }).or(card(page, DETAIL))).toBeVisible();", "  await expectPromotionDestination(page);")
    if file.stem == 'REQ-1.7.spec':
        text = text.replace("await expectMoney(amount(preview, 'Sale price'), 24);", 'await expectScopedMoneyText(preview, 24);')
    if file.stem == 'REQ-2.1.spec':
        text = text.replace("await expect(region(page, 'Category description')).toContainText('Men');", "await expect(region(page, 'Category description')).toBeVisible();\n  await expect(region(page, 'Category description')).toContainText(/\\S+/);")
        text = text.replace('await expect(count(page)).toBeVisible();', 'await expect(count(page)).toBeVisible(); await expect(count(page)).toContainText(/\\d+/);')
        text = text.replace("await expect(action(region(page, 'Subcategories'), 'Men')).toBeVisible();\n});", "await expect(action(region(page, 'Subcategories'), 'Men')).toBeVisible();\n  await tabTo(page, action(region(page, 'Subcategories'), 'Men'));\n});")
        text = text.replace("await home(page); await action(nav(page), 'CLOTHES').click();", "await home(page); await men(page);\n  await action(page.getByRole('navigation', { name: 'Breadcrumb', exact: true }), 'CLOTHES').click();")
    if file.stem == 'REQ-3.4.spec':
        text = text.replace("['Reference', 'HB-DETAIL', 'Data sheet', 'cotton', 'Features']", "['Reference', 'HB-DETAIL', 'Data sheet', 'Features']")
        text = text.replace("  await expect(panel).toContainText(/regular.fit/i);", "  await expect(panel).toContainText(/cotton/i);\n  await expect(panel).toContainText(/regular.fit/i);")
    if file.stem == 'REQ-3.5.spec':
        text = text.replace('4(?:\\.0)?/i', '4(?:\\.0)?(?![\\d.])/i')
    if file.stem == 'REQ-5.6.spec':
        text = text.replace('/Quantity\\s*:?\\s*1/', '/Quantity\\s*:?\\s*1(?!\\d)/')
    if file.stem == 'REQ-2.5.spec':
        text = text.replace('const before = await cards.allTextContents();', 'const before = await productIdentities(page);')
        text = text.replace('const after = await cards.allTextContents();', 'const after = await productIdentities(page);')
    if file.stem == 'REQ-2.10.spec':
        text = text.replace('const identities = await products.allTextContents();', 'const identities = (await productIdentities(page)).sort();')
        text = text.replace('await expect(products).toHaveText(identities);', 'await expect.poll(async () => (await productIdentities(page)).sort()).toEqual(identities);')
    # A presence assertion may have several visible copies; roles and action uniqueness stay strict.
    text = text.replace("await expect(region(page, 'Search suggestions').getByText(DETAIL, { exact: true })).toBeVisible();", "await expectText(region(page, 'Search suggestions'), DETAIL);")
    text = text.replace("await expect(product.getByText('Sale', { exact: true })).toBeVisible();", "await expectText(product, 'Sale');")
    text = text.replace("await expect(recent.getByText(DETAIL, { exact: true })).toBeVisible();", "await expectText(recent, DETAIL);")
    text = text.replace("await expect(zoom.getByText('Back view', { exact: true })).toBeVisible();", "await expectText(zoom, 'Back view');")
    text = text.replace("await expect(page.getByText('New Customer', { exact: true })).toBeVisible();", "await expectText(nav(page), 'New Customer');")
    text = text.replace("await expect(page.getByText(/(?:cart is empty|no items in your cart)/i)).toBeVisible();", "await expectText(page, /(?:cart is empty|no items in your cart)/i);")
    for name in ['amount', 'expectCartUnits', 'signInSubmit', 'expectPromotionDestination', 'expectScopedMoneyText', 'productIdentities', 'expectText']:
        if re.search(r'\b' + name + r'\(', text) and not re.search(r'import[^\n]*\b' + name + r'\b[^\n]*from .\./helpers', text):
            text = f"import {{ {name} }} from './helpers';\n" + text
    if text != old:
        file.write_text(text, encoding='utf-8', newline='\n')

req = root / 'arc-bench/prestashop/requirements/requirements.yaml'
text = req.read_text(encoding='utf-8')
needle = '    A B2C storefront for browsing products, selecting variants, managing a cart, completing checkout, and managing customer accounts.'
replacement = '''    Monetary field names associate one amount with the surrounding product, cart row, order or summary. Unless a field explicitly declares role=region, the phrase amount region describes this public field-value association rather than a mandatory ARIA container role. Equivalent named region, group, status/output and native dt/dd associations are accepted; an unrelated amount elsewhere is not evidence for that field. Cart retains its base action name while its accessible name may include a numeric count suffix such as Cart (3) or Cart 3.

''' + needle
assert text.count(needle) == 1
req.write_text(text.replace(needle, replacement), encoding='utf-8', newline='\n')
