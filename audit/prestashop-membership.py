from pathlib import Path
root=Path('outputs/arc-bench-reviewed-20261107/arc-bench/prestashop/tests')
sets={'REQ-2.6': '[DETAIL]', 'REQ-2.7': '[...HUMMINGBIRD_PRODUCTS, WHITE]',
      'REQ-2.8':'[DETAIL, WHITE]', 'REQ-2.9':'HUMMINGBIRD_PRODUCTS'}
for req,expression in sets.items():
    p=root/f'{req}.spec.ts'
    text=p.read_text(encoding='utf-8')
    extra='expectProductSet, HUMMINGBIRD_PRODUCTS' if 'HUMMINGBIRD_PRODUCTS' in expression else 'expectProductSet'
    text=f"import {{ {extra} }} from './helpers';\n"+text
    text=text.replace('\n});',f'\n  await expectProductSet(page, {expression});\n}});')
    p.write_text(text,encoding='utf-8',newline='\n')
p=root/'REQ-2.3.spec.ts'
text=p.read_text(encoding='utf-8')
text="import { expectProductSet, HUMMINGBIRD_PRODUCTS, CATALOG_PRODUCTS } from './helpers';\n"+text
before="  await expect(card(page, WHITE)).toBeVisible(); await expect(card(page, BLACK)).toHaveCount(0);\n});"
assert text.count(before)==2
text=text.replace(before,"  await expect(card(page, WHITE)).toBeVisible(); await expect(card(page, BLACK)).toHaveCount(0);\n  await expectProductSet(page, CATALOG_PRODUCTS.filter(name => name !== BLACK));\n});",1)
text=text.replace(before,"  await expect(card(page, WHITE)).toBeVisible(); await expect(card(page, BLACK)).toHaveCount(0);\n  await expectProductSet(page, [...HUMMINGBIRD_PRODUCTS, WHITE]);\n});",1)
text=text.replace("  await expect.poll(async () => (await listingPrices(page)).every(p => p >= 20)).toBe(true);", "  await expect.poll(async () => (await listingPrices(page)).every(p => p >= 20)).toBe(true);\n  await expectProductSet(page, [...HUMMINGBIRD_PRODUCTS, WHITE]);")
p.write_text(text,encoding='utf-8',newline='\n')
p=root/'REQ-2.10.spec.ts'
text=p.read_text(encoding='utf-8')
text="import { expectProductSet } from './helpers';\n"+text
text=text.replace("  await expect.poll(async () => (await listingPrices(page)).every(p => p >= 25)).toBe(true);", "  await expect.poll(async () => (await listingPrices(page)).every(p => p >= 25)).toBe(true);\n  await expectProductSet(page, [CART, STEP, 'Hummingbird order-confirmation t-shirt', 'Hummingbird order-complete t-shirt', HISTORY_PRODUCT]);")
p.write_text(text,encoding='utf-8',newline='\n')
