// requirement: REQ-7.1
import { expect } from '@playwright/test';
import { expectText } from './support/observations';
import { advanceCompare, button, expectApproval, expectBranch, expectCheck, expectHistoricalComment, expectMergedBranches,
  expectOldActionBlocked, expectOpen, historyRows, link, mergeMetadata, observeBranches, openApproval, openConfirmation,
  openPullRequest, passCheck, test } from './support/confirmation-guards';

test('REQ-7.1: Reject stale merge then require both fresh approval and fresh check', async ({ session }) => {
  const maintainer = await session('PR_MAINTAINER');
  const pr = await openPullRequest(maintainer, 'Head guard PR');
  const branches = await observeBranches(maintainer, pr);
  await expectApproval(maintainer, branches.compare.head, 'Current');
  await expectHistoricalComment(maintainer, branches.compare.head, 'Current');
  await link(maintainer, 'Checks').click();
  await expectCheck(maintainer, branches.compare.head, 'success');
  await maintainer.goto(pr);
  await openConfirmation(maintainer);

  const author = await session('PR_AUTHOR');
  const next = await advanceCompare(author, pr, branches.compare);
  await expectOldActionBlocked(maintainer, 'Confirm merge', 'Compare branch changed');
  await expectBranch(author, branches.baseUrl, branches.base);
  await expectBranch(author, branches.compareUrl, next);
  await maintainer.goto(pr);
  await expectOpen(maintainer);
  await expectApproval(maintainer, branches.compare.head, 'Stale');
  await expectHistoricalComment(maintainer, branches.compare.head, 'Outdated');
  await expect(historyRows(maintainer, 'Review history')).toHaveCount(1);
  await expect(button(maintainer, 'Merge pull request')).toBeDisabled();
  await link(maintainer, 'Checks').click();
  await expectCheck(maintainer, next.head, 'pending');

  const reviewer = await session('PR_REVIEWER');
  const submit = await openApproval(reviewer, pr);
  await submit.click();
  await expectApproval(reviewer, next.head, 'Current');
  await maintainer.goto(pr);
  await expectApproval(maintainer, next.head, 'Current');
  await expectApproval(maintainer, branches.compare.head, 'Stale');
  await expect(historyRows(maintainer, 'Review history')).toHaveCount(2);
  await expect(button(maintainer, 'Merge pull request')).toBeDisabled();
  await link(maintainer, 'Checks').click();
  await expectCheck(maintainer, next.head, 'pending');

  const admin = await session('PROTECTION_ADMIN');
  await passCheck(admin, pr, next.head);
  await maintainer.goto(pr);
  await openConfirmation(maintainer);
  await button(maintainer, 'Confirm merge').click();
  const result = await mergeMetadata(maintainer);
  expect(result.author).toBe('pr-maintainer');
  await expectMergedBranches(maintainer, branches.baseUrl, branches.base, branches.compareUrl, next, result);
  await maintainer.goto(pr);
  expect(await mergeMetadata(maintainer)).toEqual(result);
});

test('REQ-7.1: Refuse approval from an editor opened on an older commit', async ({ session }) => {
  const reviewer = await session('PR_REVIEWER');
  const pr = await openPullRequest(reviewer, 'Review guard PR');
  const branches = await observeBranches(reviewer, pr);
  await expectApproval(reviewer, branches.compare.head, 'Current');
  await openApproval(reviewer, pr);
  const author = await session('PR_AUTHOR');
  const next = await advanceCompare(author, pr, branches.compare);
  await expectOldActionBlocked(reviewer, 'Submit review', 'Compare branch changed');
  await reviewer.goto(pr);
  await expectOpen(reviewer);
  await expectApproval(reviewer, branches.compare.head, 'Stale');
  await expect(historyRows(reviewer, 'Review history')).toHaveCount(1);
  await expectBranch(reviewer, branches.baseUrl, branches.base);
  await expectBranch(reviewer, branches.compareUrl, next);
  const admin = await session('PROTECTION_ADMIN');
  await passCheck(admin, pr, next.head);

  const maintainer = await session('PR_MAINTAINER');
  await maintainer.goto(pr);
  await expectOpen(maintainer);
  await expectApproval(maintainer, branches.compare.head, 'Stale');
  await expect(historyRows(maintainer, 'Review history')).toHaveCount(1);
  await expectText(maintainer, 'Review required by branch protection', { exact: true });
  await expect(button(maintainer, 'Merge pull request')).toBeDisabled();

  const freshSubmit = await openApproval(reviewer, pr);
  await freshSubmit.click();
  await expectApproval(reviewer, next.head, 'Current');
  await maintainer.reload();
  await expectApproval(maintainer, branches.compare.head, 'Stale');
  await expectApproval(maintainer, next.head, 'Current');
  await expect(historyRows(maintainer, 'Review history')).toHaveCount(2);
  await expect(button(maintainer, 'Merge pull request')).toBeEnabled();
  await expectBranch(maintainer, branches.baseUrl, branches.base);
  await expectBranch(maintainer, branches.compareUrl, next);
});
