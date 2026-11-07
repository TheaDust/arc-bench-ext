from pathlib import Path
import re
root=Path('outputs/arc-bench-reviewed-20261107/arc-bench/prestashop/tests')
for p in root.glob('*.spec.ts'):
    text=p.read_text(encoding='utf-8')
    old=text
    text=text.replace("await expect(page.getByRole('heading', { name: 'Popular Products', exact: true })).toBeVisible();", "await expect(region(page, 'Popular Products')).toBeVisible();")
    text=re.sub(r"await expect\(page\.getByRole\('heading', \{ name: ([^,\n]+), exact: true \}\)\)\.toBeVisible\(\);", r'await expectHeading(page, \1);', text)
    if 'expectHeading(' in text:
        text="import { expectHeading } from './helpers';\n"+text
    if text!=old:
        p.write_text(text,encoding='utf-8',newline='\n')
