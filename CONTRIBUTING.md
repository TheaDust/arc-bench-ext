# Contributing

本仓库是 ARC-Bench 的派生/扩展版本。新增题目和修改验收器时，优先保持现有路径、ID 和评测入口不变；任何会改变需求语义或公共契约的修改都必须单独版本化，并明确标注旧分数不可直接比较。

## 基本原则

- **保留已有身份**：不要重命名已有题目目录、需求 ID、场景 ID、步骤 ID 或测试标题。
- **需求是合同**：测试断言必须能追溯到需求原文；不要用应用内部 CSS、私有 API、测试专用 DOM 或全局第一个匹配来“让测试通过”。
- **区分存在与动作**：普通可见文本允许重复；命名动作、记录身份、权限和结果必须唯一且严格。
- **负向检查同样重要**：删除、取消、越权、空集合、错误值和未持久化状态应有明确反例。
- **公开可观察**：只读取公开 DOM、原生属性和公开浏览器能力；不要读取应用存储或实现细节。
- **通知按可见消息定位**：需求未声明 accessible name 时，`status` / `alert` 只按精确可见文本匹配；不要用 `getByRole(..., { name })`。
- **存在与动作分开**：普通反馈和记录允许重复；需要点击的命名动作、记录身份和权限必须唯一。
- **保存 URL 用 `openUrl`**：hash 路由下相同 URL 或仅 hash 变化不会重新加载；场景文件禁止裸 `page.goto`。
- **同版对比**：需求或公共契约变化后，所有方法都必须使用同版输入重新生成/重评，旧分数不迁移。

完整规则、模板和迁移步骤见 [TESTING.md](TESTING.md)。

## 新增题目

1. 创建目录：

```text
arc-bench/<task>/
├── requirements/
│   ├── requirements.yaml
│   └── reference/
└── tests/
```

2. 在 `requirements.yaml` 中定义需求树、场景和初态。需求 ID 使用现有命名风格（如 `REQ-1.1`），场景 ID 使用 `SCN-REQ-...`。
3. 每个场景对应一个 Playwright 测试；测试标题必须与场景名称一致。
4. 需要的公共控件 helper 放在该题的 `tests/support/`，不要修改其他题目的共享文件。通知和保存 URL 使用 `validation/observable-contracts.ts` 的题目副本。
5. 把题目加入 `validation/oracle-policy.json` 的 `strictTasks`，运行 `npm run test:policy`。
5. 如果进行了逐场景语义审查，增加 `audit/<task>.md` 和 `audit/<task>.json`，并在 `audit/README.md` 的矩阵中登记。
6. 更新 `revision.json`：`revision`、`parentRevision`、`tasks`、`files` 哈希和新增文件清单。
7. 更新 `CHANGES.md` 和 `validation.json`。
8. 运行验证命令（见下）。

## 修改已有题目

- 先判断是 **测试修正** 还是 **需求澄清**：
  - 只修测试：需求不变，记录为 oracle 修正。
  - 修改需求或公共契约：必须提升修订号，并在 `CHANGES.md` 中披露兼容性影响。
- 不要删除已有场景来“修复”失败；优先补充/收紧断言，或在确有歧义时明确需求。
- 任何新公开契约（角色、可访问名称、选中状态、记录身份等）都要写回需求，并增加正反例合同。

## 验证

在本仓库根目录执行：

```powershell
npm install --no-audit --no-fund
npx playwright install chromium
npm run typecheck
npm run test:contracts
npm run test:policy
npm run test:collect
npm run test:inputs
npm run test:closeout
```

定向验证或参考实现门禁：

```powershell
node validation/run-task-suite.mjs <task> <base-url> [--grep <pattern>]
```

该入口共用一个应用实例，不替代 `evaluate-project.mjs` 的逐场景隔离计分。详见 [TESTING.md](TESTING.md)。

新增或修改题目后，至少运行与该题相关的类型检查、场景收集和合同回归；涉及共享 helper、执行器或公共契约时，运行完整验证。

## 提交与版本

- `main`：稳定可评测版本。
- `next`（可选）：下一轮扩展或审查。
- 提交信息建议：
  - `feat(<task>): add ...`
  - `fix(<task>): ...`
  - `docs: ...`
  - `benchmark: <revision>`
- 每轮发布使用日期型修订标签，例如：
  - `2026-11-07-per-task-semantic-review`
  - `2026-11-07-bookstack-lifecycle`
  - `2027-xx-xx-<short-description>`
- 不要强制推送或改写已发布的 benchmark 标签；需要修正时新增修订。

## 上游同步

上游只作为只读参考：

```powershell
git remote add upstream https://github.com/code-philia/arc-bench.git
git fetch upstream
git log --oneline --decorate -10 upstream/main
git diff upstream/main..HEAD --stat
```

本仓库与上游没有共同 Git 历史，不要直接 merge unrelated histories。优先使用 `cherry-pick` 或按题目生成补丁后人工合并。详见 [UPSTREAM.md](UPSTREAM.md)。

## 授权

上游快照中没有 `LICENSE` 文件；在确认上游授权前，不要新增或更换许可证，也不要把本仓库描述为官方 ARC-Bench。详见 [NOTICE](NOTICE)。
