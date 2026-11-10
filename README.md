# ARC-Bench Ext

扩展/派生版 ARC-Bench：在原始 ARC-Bench 的基础上做逐场景语义审查、验收器加固、场景隔离和可复现评测。

> **本仓库不是官方 ARC-Bench。**  
> 上游：<https://github.com/code-philia/arc-bench>  
> 导入 commit：`e59696bbc68578c3b3da1ad47f9a0ac07e581184`  
> 当前修订：`2026-11-10-observable-outcome-r2`
> 本版需求、测试和公共契约与上游不同，旧分数不能直接迁移或混算。

## Overview

ARC-Bench Ext is an extended, independently maintained derivative of ARC-Bench. It preserves the upstream task, requirement, and scenario identities while adding reviewed oracles, scenario isolation, contract tests, and reproducible evaluation tooling. It is **not** the official upstream benchmark.

## 概览

本仓库包含 8 个 Web 应用的需求、参考图片、Playwright 场景、可执行验收器以及 benchmark 自身的验证套件。

| 题目 | 原子需求 | 场景 |
| --- | ---: | ---: |
| 12306 | 93 | 142 |
| bookstack | 29 | 56 |
| ctrip | 97 | 152 |
| github | 49 | 104 |
| keep | 22 | 49 |
| prestashop | 55 | 86 |
| sheet | 26 | 104 |
| stackoverflow | 52 | 66 |
| **合计** | **423** | **759** |

当前修订在保留既有需求 ID、场景 ID 和场景名称的前提下，修正需求—测试错配、补充漏断言、增加正反例合同，并显式记录未决项。BookStack 生命周期扩展新增 2 条原子需求、14 个场景，覆盖页面/章节删除、书架成员关系、重命名/删除后的跨视图一致性、草稿发布与隐私、多用户收藏/最近浏览隔离。Keep 生命周期扩展新增 REQ-2.10/REQ-2.11 与 8 个生命周期/标签/搜索场景；Keep 与 BookStack 组合约束新增 7 条需求、15 个场景，见 [audit/interactions.md](audit/interactions.md)。本版合并的 Sheet 与 GitHub 事务守卫新增 4 条需求、8 个场景，见 [audit/transaction-guards.md](audit/transaction-guards.md)。历史审查见 [audit/README.md](audit/README.md)。本轮题面审查见 [GitHub](audit/github-experiment-polish.md)、[12306](audit/12306-experiment-polish.md) 和 [Ctrip](audit/ctrip-experiment-polish.md)。

## 当前状态

| 项目 | 值 |
| --- | --- |
| 修订 | `2026-11-10-observable-outcome-r2` |
| 父版本 | `2026-11-10-github-12306-ctrip-experiment-polish`（f7834e9） |
| 需求 / 场景 | 423 / 759 |
| 质量状态 | 见验证记录；完整候选应用与配对实验待执行 |
| 审查发现 | 112 项既有发现：91 项修复，21 项保留（7 项 high）；扩展新增 13 类记录，无新增需求缺陷 |
| 本轮变更 | 澄清三题的既有验收结果并收紧 GitHub PR 证据；全库仍是 423 条原子需求、759 个场景 |
| 历史参考验证（修复前） | 父版 BookStack 49/49；观测修复在既有 `pi` 候选定向复验：BookStack 5/5（REQ-11.1/11.3），Keep 7/7（REQ-2.4/6.4）；BookStack REQ-5.4 Cancel 仍为真实实现缺陷 |
| 验证记录 | [validation.json](validation.json)、[父版记录](https://github.com/TheaDust/arc-bench-ext/blob/f7834e9976d2354aecb1f41d58e1a98746766b76/validation.json) |

本版是模型辅助的逐场景审查，不等同于人工双盲标注或完整应用通过率测量；完整产品行为与模型区分度尚需实际执行，具体边界见 [QUALITY.md](QUALITY.md) 与 [audit/README.md](audit/README.md)。

## 目录结构

```text
arc-bench-ext/
├── arc-bench/
│   ├── <task>/
│   │   ├── requirements/
│   │   │   ├── requirements.yaml
│   │   │   └── reference/
│   │   └── tests/
│   └── ...
├── audit/                 # 逐题审查报告、场景矩阵与合同测试
├── validation/            # benchmark 自身验证脚本、报告与历史记录
├── revision.json          # 冻结清单：任务、文件哈希、修订信息
├── validation.json        # 本版验证结果
├── CHANGES.md             # 修订历史
├── TESTING.md             # 观测合同、共享 helper、静态策略与扩展清单
├── QUALITY.md             # 质量与证据边界
├── CONSISTENCY.md         # 历史一致性收口记录
├── UPSTREAM.md            # 上游来源与同步策略
├── CONTRIBUTING.md        # 扩展与提交约定
├── NOTICE                 # 来源与授权声明
├── evaluate-project.mjs   # 单题评测入口
└── setup-playwright.*     # Playwright 环境生成脚本
```

`arc-bench/<task>/` 的路径是评测入口的一部分；新增题目时请保持该结构，不要重命名已有目录、需求 ID、场景 ID 或步骤 ID。

## 评测

### 使用 ShallowCode 运行

在 ShallowCode 仓库根目录执行：

```powershell
npm run experiment -- run --bench-root <本仓库路径> --tasks stackoverflow --methods baseline,shallow --repeats 1
```

`--methods` 支持 baseline / shallow / arc；实验 `run` 会用所选方法调用生成模型。只对已有应用评分请使用下方的独立重验入口。

### 单独重验已有产物

应用必须声明 `shallowcode.config.json`，输出目录必须是新目录：

```powershell
node <本仓库路径>/evaluate-project.mjs <ShallowCode 根目录> stackoverflow <应用目录> <新评测目录> baseline
```

入口会先验证冻结的控制器和单题输入，保存 manifest，再收集测试并逐场景评测。退出码：`0` 全部通过，`1` 存在业务失败，`2` 执行错误。正式运行应保留新目录中的 `manifest.json`、`evaluation/evaluation.json`、`cases.json`、逐场景报告、日志和浏览器产物。

每个场景启动独立应用进程和独立数据副本；场景内的刷新、多个 BrowserContext 和多个账户共享该服务。构建和安装在源码未变时复用。预算为：1 worker、0 retry、60 秒场景超时、10 秒断言、15 秒动作、30 秒导航。

## 验证 benchmark 自身

在本目录安装固定依赖后执行：

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

单个题目对参考实现或候选应用做定向回归：

```powershell
node validation/run-task-suite.mjs <task> <base-url> [--grep <pattern>]
```

该入口共用一个应用实例，只用于观测合同与定向修复；正式计分使用 `evaluate-project.mjs` 的逐场景隔离协议。详见 [TESTING.md](TESTING.md)。

这些检查覆盖类型、场景收集、输入完整性、公共控件合同和合成应用探针；它们不能替代 8 题真实应用的完整业务重验。

## 文档

- [SHEET-EXPERIMENT.md](SHEET-EXPERIMENT.md)：Sheet R2 输入域、方法能力、计分与启动门禁

- [UPSTREAM.md](UPSTREAM.md)：上游来源、导入 commit、同步策略
- [TESTING.md](TESTING.md)：观测合同、共享通知/导航 helper、静态策略和扩展清单
- [CHANGES.md](CHANGES.md)：逐轮修订记录
- [QUALITY.md](QUALITY.md)：质量状态、证据范围和限制
- [CONSISTENCY.md](CONSISTENCY.md)：历史一致性收口记录
- [audit/README.md](audit/README.md)：逐题审查矩阵、发现和未决项
- [validation.json](validation.json)：本版验证结果
- [CONTRIBUTING.md](CONTRIBUTING.md)：新增题目、测试和版本的约定
- `review.patch`：本轮题内需求、测试与合同修改的补丁

## 上游与授权

本仓库是独立的派生/扩展仓库，**不是 GitHub fork**，也不代表上游官方版本。

- 上游：<https://github.com/code-philia/arc-bench>
- 导入 commit：`e59696bbc68578c3b3da1ad47f9a0ac07e581184`
- 本仓库当前修订：`2026-11-10-observable-outcome-r2`

上游快照中没有 `LICENSE` 文件；本仓库目前也没有单独声明开源许可证。公开分发或再利用上游材料前，请先确认上游作者的授权。详见 [NOTICE](NOTICE) 和 [UPSTREAM.md](UPSTREAM.md)。

## 引用

如果使用原始 ARC-Bench，请引用上游论文：

```bibtex
@article{kong2026arc,
  author    = {Weiyu Kong and Yun Lin and Xiwen Teoh and Duc-Minh Nguyen and Ruofei Ren and Jiaxin Chang and Haoxu Hu and Haoyu Chen},
  title     = {Compiling Large Multi-Modal Requirement Documents into Runnable Software Systems: From an Agentic Test-Driven Perspective},
  booktitle = {Proceedings of the ACM SIGSOFT International Symposium on Software Testing and Analysis},
  year      = {2026},
  series    = {ISSTA}
}
```

如果使用本扩展版，请同时记录本仓库、当前修订标签和上游 commit。
