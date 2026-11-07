import { test, expect } from '@playwright/test';
import { action, completeEmptyTrash, expectEmptyTrash, expectNote, expectNoteInCollection, expectNotice, expectSearchHighlights, expectSingleColumn, note } from '../../arc-bench/keep/tests/helpers';
import { expectLightGreenSurface } from '../../arc-bench/keep/tests/visual';

test('keep repeated visible title and content satisfy one note identity', async ({ page }) => {
  await page.setContent('<section aria-label="Project"><h2>Project</h2><span>Project</span><p>Saved content</p><p>Saved content</p></section>');
  await expectNote(page, 'Project', 'Saved content');
});

test('keep one note cannot borrow another note content', async ({ page }) => {
  await page.setContent('<section aria-label="Project"><h2>Project</h2><p hidden>Saved content</p><p>Wrong content</p></section><section aria-label="Other">Saved content</section>');
  await expect(expectNote(page, 'Project', 'Saved content')).rejects.toThrow();
});

test('keep target collection contains its own note identity and content', async ({ page }) => {
  await page.setContent('<section aria-label="Deleted notes"><section aria-label="Project"><h2>Project</h2><p>Saved content</p></section></section>');
  await expectNoteInCollection(page, 'Deleted notes', 'Project', 'Saved content');
});

test('keep matching note outside the required collection cannot satisfy membership', async ({ page }) => {
  await page.setContent('<section aria-label="Deleted notes"></section><aside><section aria-label="Project"><h2>Project</h2><p>Saved content</p></section></aside>');
  await expect(expectNoteInCollection(page, 'Deleted notes', 'Project', 'Saved content')).rejects.toThrow();
});

test('keep duplicate named note or action remains ambiguous', async ({ page }) => {
  await page.setContent('<section aria-label="Project">Project</section><section aria-label="Project">Project</section><button>Undo</button><button>Undo</button>');
  await expect(expectNote(page, 'Project')).rejects.toThrow();
  await expect(action(page, 'Undo').click()).rejects.toThrow();
});

test('keep multiple independently created notifications may have the same feedback', async ({ page }) => {
  await page.setContent('<p role="status" aria-label="Note deleted">Deleted Project</p><p role="status" aria-label="Note deleted">Deleted Other</p>');
  await expectNotice(page, 'Note deleted');
});

test('keep hidden-only or incorrect notifications do not satisfy deletion', async ({ page }) => {
  await page.setContent('<p hidden role="status" aria-label="Note deleted">Deleted</p><p role="status" aria-label="Note archived">Archived</p>');
  await expect(expectNotice(page, 'Note deleted')).rejects.toThrow();
});

test('keep empty Trash accepts the direct public outcome', async ({ page }) => {
  await page.setContent('<section aria-label="Deleted notes"></section>');
  await completeEmptyTrash(page);
});

test('keep optional Trash confirmation may coexist with an empty visible collection', async ({ page }) => {
  await page.setContent('<section aria-label="Deleted notes"></section><div role="dialog" aria-label="Empty Trash"><button onclick="this.parentElement.remove()">Empty Trash</button></div>');
  await completeEmptyTrash(page);
  await expect(page.getByRole('dialog', { name: 'Empty Trash', exact: true })).toHaveCount(0);
});

test('keep missing Deleted notes cannot pass the empty oracle', async ({ page }) => {
  await page.setContent('<main>No trash view was implemented</main>');
  await expect(expectEmptyTrash(page)).rejects.toThrow();
});

test('keep hidden Deleted notes cannot pass the empty oracle', async ({ page }) => {
  await page.setContent('<section hidden aria-label="Deleted notes"></section>');
  await expect(expectEmptyTrash(page)).rejects.toThrow();
});

test('keep ambiguous duplicate empty collections do not pass', async ({ page }) => {
  await page.setContent('<section aria-label="Deleted notes"></section><section aria-label="Deleted notes"></section>');
  await expect(expectEmptyTrash(page)).rejects.toThrow();
});

test('keep undeleted notes cannot satisfy direct empty outcome', async ({ page }) => {
  await page.setContent('<section aria-label="Deleted notes"><section aria-label="Project">Project</section></section>');
  await expect(completeEmptyTrash(page)).rejects.toThrow();
});

test('keep a confirmation that leaves a deleted note cannot pass', async ({ page }) => {
  await page.setContent('<section aria-label="Deleted notes"><section aria-label="Project">Project</section></section><div role="dialog" aria-label="Empty Trash"><button onclick="this.parentElement.remove()">Empty Trash</button></div>');
  await expect(completeEmptyTrash(page)).rejects.toThrow();
});

test('keep single column permits unequal widths and centered alignment', async ({ page }) => {
  await page.setContent('<section aria-label="A" style="width:200px;height:40px;margin-left:100px">A</section><section aria-label="B" style="width:140px;height:40px;margin-left:130px;margin-top:10px">B</section>');
  await expectSingleColumn([note(page, 'A'), note(page, 'B')]);
});

test('keep side-by-side cards are not a single-column list', async ({ page }) => {
  await page.setContent('<div style="display:flex;gap:20px"><section aria-label="A" style="width:100px;height:40px">A</section><section aria-label="B" style="width:100px;height:40px">B</section></div>');
  await expect(expectSingleColumn([note(page, 'A'), note(page, 'B')])).rejects.toThrow();
});

test('keep overlapping cards are not a nonoverlapping list', async ({ page }) => {
  await page.setContent('<section aria-label="A" style="position:absolute;left:100px;top:100px;width:100px;height:40px">A</section><section aria-label="B" style="position:absolute;left:100px;top:120px;width:100px;height:40px">B</section>');
  await expect(expectSingleColumn([note(page, 'A'), note(page, 'B')])).rejects.toThrow();
});

test('keep each visible matching highlight is checked without requiring a unique occurrence', async ({ page }) => {
  await page.setContent('<section aria-label="Project"><span role="region" aria-label="Highlight st">St</span><span role="region" aria-label="Highlight st">st</span></section>');
  await expectSearchHighlights(note(page, 'Project'), 'st');
});

test('keep an incorrect or hidden-only highlight remains invalid', async ({ page }) => {
  await page.setContent('<section aria-label="Project"><span role="region" aria-label="Highlight st">story</span></section>');
  await expect(expectSearchHighlights(note(page, 'Project'), 'st')).rejects.toThrow();
  await page.setContent('<section aria-label="Project"><span hidden role="region" aria-label="Highlight st">st</span></section>');
  await expect(expectSearchHighlights(note(page, 'Project'), 'st')).rejects.toThrow();
});

test('keep actual green surface satisfies the already available visual oracle', async ({ page }) => {
  await page.setContent('<section aria-label="Project" style="width:240px;height:120px;background:#d8efd1">Project</section>');
  await expectLightGreenSurface(note(page, 'Project'));
});

test('keep a green badge alone cannot fake the required note background', async ({ page }) => {
  test.setTimeout(15_000);
  await page.setContent('<section aria-label="Project" style="width:240px;height:120px;background:white">Project<span style="background:#d8efd1">Light green</span></section>');
  await expect(expectLightGreenSurface(note(page, 'Project'))).rejects.toThrow();
});
