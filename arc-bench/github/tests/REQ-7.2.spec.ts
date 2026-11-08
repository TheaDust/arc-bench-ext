// requirement: REQ-7.2
import { expect } from '@playwright/test';
import { clickVisibleTarget, openVisibleRepository } from './support/e2e';
import { selectChoice, expectSelectedChoice } from './support/public-controls';
import { button, expectApproval, expectBranch, expectCheck, expectMergedBranches, expectOldActionBlocked, expectOpen,
  historyRows, link, mergeMetadata, observeBranches, openConfirmation, openPullRequest, test } from './support/confirmation-guards';

test('REQ-7.2: Reject a stale merge after a team grant is downgraded', async ({ session }) => {
  const maintainer = await session('PR_MAINTAINER');
  const pr = await openPullRequest(maintainer, 'Access guard PR');
  const branches = await observeBranches(maintainer, pr);
  await expectApproval(maintainer, branches.compare.head, 'Current');
  await openConfirmation(maintainer);

  const admin = await session('PROTECTION_ADMIN');
  await openVisibleRepository(admin, 'access-guard');
  await clickVisibleTarget(admin, 'Settings');
  await clickVisibleTarget(admin, 'Manage access');
  const grant = (name: string) => admin.getByRole('row').filter({ has: admin.getByRole('cell', { name, exact: true }) });
  const direct = (name: string) => grant(name).getByRole('combobox', { name: 'Role', exact: true });
  const team = grant('guard-team');
  await expect(team).toHaveCount(1);
  const role = team.getByRole('combobox', { name: 'Role', exact: true });
  await expectSelectedChoice(role, 'Maintain');
  await expectSelectedChoice(direct('pr-maintainer'), 'Read');
  await expectSelectedChoice(direct('guard-maintainer'), 'Maintain');
  await selectChoice(role, { label: 'Read' });
  await button(team, 'Save').click();
  await expect(admin.getByRole('status', { name: 'Access saved', exact: true })).toBeVisible();
  await admin.reload();
  await expectSelectedChoice(role, 'Read');
  await expectSelectedChoice(direct('pr-maintainer'), 'Read');
  await expectSelectedChoice(direct('guard-maintainer'), 'Maintain');

  await expectOldActionBlocked(maintainer, 'Confirm merge', 'Merge permission required');
  await maintainer.goto(pr);
  await expect(maintainer.getByRole('heading', { name: 'Access guard PR', exact: true })).toBeVisible();
  await expectOpen(maintainer);
  const merge = button(maintainer, 'Merge pull request');
  // Read-only users may see a disabled action or no merge action at all.
  await expect.poll(async () => {
    const visible = merge.filter({ visible: true });
    const count = await visible.count();
    return count === 0 || (count === 1 && await visible.isDisabled());
  }).toBe(true);
  await expectApproval(maintainer, branches.compare.head, 'Current');
  await expect(historyRows(maintainer, 'Review history')).toHaveCount(1);
  await link(maintainer, 'Checks').click();
  await expectCheck(maintainer, branches.compare.head, 'success');
  await expectBranch(maintainer, branches.baseUrl, branches.base);
  await expectBranch(maintainer, branches.compareUrl, branches.compare);

  const independent = await session('GUARD_MAINTAINER');
  await independent.goto(pr);
  await openConfirmation(independent);
});

test('REQ-7.2: Commit one merge when two valid confirmations were opened', async ({ session }) => {
  const first = await session('PR_MAINTAINER');
  const second = await session('GUARD_MAINTAINER');
  const pr = await openPullRequest(first, 'Race guard PR');
  const branches = await observeBranches(first, pr);
  await second.goto(pr);
  await openConfirmation(first);
  await openConfirmation(second);
  await button(first, 'Confirm merge').click();
  const result = await mergeMetadata(first);
  expect(result.author).toBe('pr-maintainer');
  await expectMergedBranches(first, branches.baseUrl, branches.base, branches.compareUrl, branches.compare, result);

  await expectOldActionBlocked(second, 'Confirm merge', 'Pull request already merged');
  await second.goto(pr);
  expect(await mergeMetadata(second)).toEqual(result);
  await first.goto(pr);
  expect(await mergeMetadata(first)).toEqual(result);
  await expectMergedBranches(first, branches.baseUrl, branches.base, branches.compareUrl, branches.compare, result);
});
