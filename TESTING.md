# 测试健壮性与题库扩展规范

本文件说明如何让场景测试只检验需求声明过的公开行为，并把 **Keep / BookStack** 作为可复制的范本。目标不是让测试“更宽松”，而是把观测合同写清楚：合法实现都能通过，错误值、错误身份、错误状态仍然失败。

## 1. 观测合同

### 1.1 身份只来自需求

- 需求写了 `"Note deleted"(role=status)`，就只要求 **status 角色 + 可见文本**。
- 需求没有声明 `aria-label` / accessible name 时，测试不得要求它。ARIA 的 `status` / `alert` 不会从内容推导 accessible name；按 `name` 查询会把正确实现判错，也会让 `aria-label` 与可见文本不一致的实现蒙混过关。
- 需求声明了某个动作、记录或区域的名称，才按该名称唯一定位。

### 1.2 存在与动作分开

- 普通可见文本、通知、记录可以重复；存在性检查应接受重复。
- 命名动作、记录身份、权限和结果必须唯一；需要点击时只允许一个匹配目标。
- 通知的消失时机通常不在需求范围内，因此“同一通知只能出现一次”不是默认合同。

### 1.3 可见性

- 结果必须可见；`hidden`、`aria-hidden`、`display:none` 或隐藏文本不能替代可见结果。
- 负向断言（删除、取消、未授权）要同时排除可见残留和可访问残留。
- 允许空集合没有渲染面积；通过 role/region 的存在性判断，不要求占位符。

### 1.4 导航

- hash 路由下，跳到 **相同 URL** 或 **只改变 hash** 都是 same-document navigation：`page.goto` 不会重新加载文档，也不会重新取数。
- 场景只要表达“重新打开保存的 URL”，就必须使用 `openUrl`；明确要求刷新时才使用 `reload` / `reopen`。
- 同一 hash URL 的 `goto` 是测试缺陷，不是应用缺陷。

### 1.5 当前边界

- `expectNotice` / `expectAlert` 合并消息中跨内联标签的文本并规范化空白，按完整消息精确比较；排除隐藏、`aria-hidden`、`inert` 内容及按钮文案。独立块级说明可以与消息共存。匹配通过只读 selector engine 执行，保留 Locator 自动重试与动作唯一性。
- 合同只验证公开 DOM、原生属性和公开浏览器能力；不读取应用存储、私有 API 或测试专用属性。

## 2. 共享工具包

| 文件 | 作用 |
| --- | --- |
| `validation/observable-contracts.ts` | 规范模板：通知定位、可见文本、存在性、URL 重开 |
| `arc-bench/keep/tests/support/observable.ts` | Keep 的独立副本 |
| `arc-bench/bookstack/tests/support/observable.ts` | BookStack 的独立副本 |

副本必须与模板逐字一致（换行符除外），由 `validation/audit-inputs.mjs` 校验。评测只复制单题 `tests/`，所以不能跨题共享运行时文件。

主要 API：

```ts
import { alertMessage, expectAlert, expectNotice, liveRegion, notice, openUrl, reopen } from './helpers';

await expectNotice(page, 'Revision draft saved'); // role=status + 精确可见文本
await expectAlert(page, 'Page deleted');          // role=alert + 精确可见文本
const notification = notice(page, 'Note deleted'); // 需要进一步限定动作时
await openUrl(page, savedUrl);                     // 相同/仅 hash 不同也会重新加载
await reopen(page);                                // 明确刷新
```

合同回归：

- `validation/observable-contracts.spec.ts`：对 Keep 与 BookStack 两份副本跑同一组正反例（直接/包裹文本、有无 accessible name、错误文本、隐藏文本、重复通知、status/alert 区分）。
- `validation/navigation-contracts.spec.ts`：验证相同 URL、仅 hash 变化、路径变化和相对 URL。
- `validation/keep-notification-contracts.spec.ts`：Keep 通知动作的作用域与重复反馈。

## 3. 静态策略检查

`validation/oracle-policy.json` 声明严格题目和规则，`validation/lint-oracles.mjs` 扫描 `tests/**/*.spec.ts`：

```powershell
npm run test:policy
```

| 规则 | 级别 | 说明 |
| --- | --- | --- |
| `requirement-header` | error | 每个场景文件必须在前 5 行标注 `// requirement: REQ-...` |
| `live-region-name` | error | 禁止 `getByRole('status' \| 'alert', { name })`；改用可见消息 helper |
| `direct-navigation` | error | 场景文件禁止裸 `page.goto`；保存 URL 用 `openUrl` |
| `timed-wait` | error | 禁止 `waitForTimeout` |
| `focused-test` | error | 禁止 `.only` |
| `message-traceability` | error | `expectNotice` / `expectAlert` 的字面消息必须出现在该题 `requirements.yaml` |
| `arbitrary-index` | warning | `.first()` / `.last()` 只能用于存在性，不能替代语义作用域 |

Keep 与 BookStack 当前为严格题目（0 error）。其余题目先以 warning 形式登记迁移目标，不阻塞现有评测：

| 题目 | 当前 warning |
| --- | ---: |
| 12306 | 0 |
| ctrip | 0 |
| github | 58 |
| prestashop | 5 |
| sheet | 27 |
| stackoverflow | 0 |

报告写入 `validation/oracle-policy-report.json`。

## 4. 对参考实现/候选应用跑单题套件

```powershell
node validation/run-task-suite.mjs bookstack http://127.0.0.1:33210
node validation/run-task-suite.mjs bookstack http://127.0.0.1:33210 --grep "REQ-11.1|REQ-11.3"
```

脚本把该题 `tests/` 复制到 `validation/suites/`，生成独立 Playwright 配置并对指定 base URL 运行。`--output` 必须指定不存在的新目录；已有目录会被拒绝，不清空或覆盖。

> 该入口让所有场景共用一个应用实例，只适合参考实现门禁和定向回归，**不是计分入口**。正式评测必须使用 `evaluate-project.mjs` 或同版实验运行器，每个场景独立进程和初态副本。

参考门禁的判断标准：

1. 合规参考实现必须全套通过；失败先判定为测试或需求问题。
2. 故意错误的反例必须失败；只过正向不能证明断言有区分力。
3. 定向修复后只重跑受影响场景；冻结前用同版输入对全部方法重评。

## 5. 扩展到其余题目

1. 复制 `validation/observable-contracts.ts` 到 `<task>/tests/support/observable.ts`。
2. 在 `tests/helpers.ts` 中导入并重新导出 `notice` / `alertMessage` / `expectNotice` / `expectAlert` / `openUrl` / `reopen`。
3. 把 `getByRole('status'|'alert', { name })` 改为 `expectNotice` / `expectAlert`；把保存 URL 的 `page.goto` 改为 `openUrl`。
4. 把题目加入 `oracle-policy.json` 的 `strictTasks`，运行 `npm run test:policy`，逐条修复 error；warning 可按题目优先级排期。
5. 运行 `npm run typecheck`、`npm run test:contracts`、`npm run test:collect`。
6. 用合规参考实现跑 `run-task-suite.mjs`；参考实现红则先修测试/需求，不得直接改实现来迁就测试。
7. 更新 `revision.json`、`CHANGES.md`、`validation.json`，并把新结果作为新版本报告；旧分数不迁移。

## 6. 合同报告归档

合同运行的 JSON 报告写入 `validation/.tmp/contracts-<时间戳>-<进程号>.json`，每次运行独立保存。定向运行和临时探针不会覆盖已归档的完整报告。确认完整套件的实际结果后，才手动归档报告并更新 `validation.json`。

父版声称的 110/110 完整报告已被临时探针覆盖，未找到可恢复副本；原声明与探针保存在 `validation/history/2026-11-09-keep-bookstack-observation-hardening/`。本次修复仅完成静态检查，新增合同用例尚未执行。

## 7. 证据边界

- 合同回归和静态策略证明的是 **观测边界**，不是真实应用通过率。
- 参考实现全绿只证明需求可满足，不证明所有合法 UI 变体都被接受；当前已知边界见 1.5。
- 共享实例套件（第 4 节）会出现收藏/最近浏览上限等跨场景污染，不能当作 56 个独立场景的分数。
- 任何影响需求语义或公共合同的修改都必须版本化，并对所有方法使用同版输入重跑。
