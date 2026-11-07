# ARC-Bench modified

本目录包含 8 个 Web 应用题目的需求、参考图片、Playwright 场景和运行脚本。结构与 ARC-Bench 一致，可作为 ShallowCode 的 `--bench-root` 使用。来源和逐文件摘要见 [revision.json](revision.json)。

| 题目 | 原子需求 | 场景 |
| --- | ---: | ---: |
| `12306` | 93 | 142 |
| `bookstack` | 24 | 35 |
| `ctrip` | 97 | 152 |
| `github` | 47 | 100 |
| `keep` | 16 | 33 |
| `prestashop` | 55 | 86 |
| `sheet` | 24 | 100 |
| `stackoverflow` | 52 | 66 |
| **合计** | **408** | **714** |

```text
arc-bench/
  <task>/
    requirements/requirements.yaml
    requirements/reference/
    tests/
setup-playwright.cjs
setup-playwright.ps1
setup-playwright.sh
validation/
```

使用所选题目的 `arc-bench/<task>/requirements/` 生成并启动应用。在独立评测目录复制该题目的 `tests/` 后，从评测目录运行：

```powershell
& 'E:\my-works\coding\arc-bench-modified\setup-playwright.ps1' 'http://127.0.0.1:3000'
npm run test:e2e
```

Linux 或 macOS 可从包含 `tests/` 的评测目录执行：

```bash
source /path/to/arc-bench-modified/setup-playwright.sh http://127.0.0.1:3000
npm run test:e2e
```

应用负责初始化需求声明的账户、业务对象和时钟。评测使用一个应用入口、1 worker、0 retry 和 60 秒单场景超时、10 秒断言超时；时区按题目配置，独立运行使用各自的数据目录。

运行此修订版的控件合同回归时，在本目录安装依赖后执行：

```powershell
npm install --no-audit --no-fund
npx playwright install chromium
npm run typecheck
npm run test:contracts
npm run test:collect
npm run test:inputs
```

当前修订为 `2026-11-06-consistency-audit`。验证范围和实测结果见 [validation.json](validation.json)：714 个正式场景的收集与逐需求场景数核对、全题类型检查、公共控件正反例，以及现有 BookStack 应用的端到端检查。其余题目的控件回归和场景收集不代表完整业务通过率。

`test:collect` 将正式测试清单写入 `validation/collection-report.json`，并核对每条需求的场景数量、引用、图片与冻结摘要；`test:inputs` 单独检查输入和文件完整性。公共控件模板位于 `validation/public-controls.ts`，各题的 `tests/support/public-controls.ts` 是相同的独立副本，复制单题 tests/ 即可运行；输入审计会拒绝副本漂移。

[QUALITY.md](QUALITY.md) 说明逐题问题、验收边界和后续验证要求。

[CHANGES.md](CHANGES.md) 记录各题修订，[validation.json](validation.json) 记录验证范围与结果。原版与修订版应使用各自固定的需求和测试包分别报告结果。

本轮需求与测试复查详见 [CONSISTENCY.md](CONSISTENCY.md)。当前质量状态为 `known-gaps`：运行器尚需保证逐场景的服务端初态隔离，复杂结果与部分记录归属仍待补齐；714 场景映射和合同回归通过不代表这些问题已闭合。正式计分前先完成该报告中的 5 组问题。
