from pathlib import Path
root=Path('outputs/arc-bench-reviewed-20261107/arc-bench/prestashop/tests')
for req,total in [('REQ-2.6',1),('REQ-2.7',8),('REQ-2.8',2),('REQ-2.9',7)]:
    p=root/f'{req}.spec.ts'
    text=p.read_text(encoding='utf-8')
    text="import { expectProductTotal } from './helpers';\n"+text
    text=text.replace('await expect(count(page)).not.toHaveText(before);',f'await expect(count(page)).not.toHaveText(before); await expectProductTotal(page, {total});')
    p.write_text(text,encoding='utf-8',newline='\n')
p=root/'REQ-2.3.spec.ts'
text=p.read_text(encoding='utf-8')
text="import { expectProductTotal } from './helpers';\n"+text
text=text.replace("await expect(card(page, WHITE)).toBeVisible(); await expect(card(page, BLACK)).toHaveCount(0);\n});", "await expect(card(page, WHITE)).toBeVisible(); await expect(card(page, BLACK)).toHaveCount(0);\n});")
text=text.replace('await expect(count(page)).not.toHaveText(before);','await expect(count(page)).not.toHaveText(before); await expectProductTotal(page, 8);')
p.write_text(text,encoding='utf-8',newline='\n')
