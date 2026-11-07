# ARC-Bench Ext

扩展/派生版 ARC-Bench：在原始 ARC-Bench 的基础上做逐场景语义审查、验收器加固、场景隔离和可复现评测。

> **本仓库不是官方 ARC-Bench。**  
> 上游：<https://github.com/code-philia/arc-bench>  
> 导入 commit：`e59696bbc68578c3b3da1ad47f9a0ac07e581184`  
> 当前修订：`2026-11-07-per-task-semantic-review`  
> 本版需求、测试和公共契约与上游不同，旧分数不能直接迁移或混算。

## Overview

ARC-Bench Ext is an extended, independently maintained derivative of ARC-Bench. It preserves the upstream task, requirement, and scenario identities while adding reviewed oracles, scenario isolation, contract tests, and reproducible evaluation tooling. It is **not** the official upstream benchmark.

## 概览

本仓库包含 8 个 Web 应用的需求、参考图片、Playwright 场景、可执行验收器以及 benchmark 自身的验证套件。

| 题目 | 原子需求 | 场景 |
| --- | ---: | ---: |
| 12306 | 93 | 142 |
| bookstack | 24 | 35 |
| ctrip | 97 | 152 |
| github | 47 | 100 |
| keep | 16 | 33 |
| prestashop | 55 | 86 |
| sheet | 24 | 100 |
| stackoverflow | 52 | 66 |
| **合计** | **408** | **714** |

当前修订在保留需求 ID、场景 ID、场景名称和 408/714 分母的前提下，修正需求—测试错配、补充漏断言、增加正反例合同，并显式记录未决项。详细记录见 [audit/README.md](audit/README.md)。

## 当前状态

| 项目 | 值 |
| --- | --- |
| 修订 | `2026-11-07-per-task-semantic-review` |
| 父版本 | `2026-11-06-isolated-scenarios` |
| 质量状态 | `all-scenarios-source-reviewed-with-explicit-limitations` |
| 审查发现 | 112 项：91 项修复，21 项保留（7 项 high） |
| 新增合同 | 175 条通过 |
| 原有合同 | 73 条通过 |
| 完整 714 场景真实应用重验 | 尚未执行 |
| 验证记录 | [validation.json](validation.json) |

本版是模型辅助的逐场景审查，不等同于人工双盲标注或完整应用通过率测量。具体边界见 [QUALITY.md](QUALITY.md) 和 [audit/README.md](audit/README.md)。

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

`--methods` 支持 baseline / shallow / arc；它只选择运行合同兼容方式，不调用生成模型。

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
npm run test:collect
npm run test:inputs
npm run test:closeout
```

这些检查覆盖类型、场景收集、输入完整性、公共控件合同和合成应用探针；它们不能替代 8 题真实应用的完整业务重验。

## 文档

- [UPSTREAM.md](UPSTREAM.md)：上游来源、导入 commit、同步策略
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
- 本仓库当前修订：`2026-11-07-per-task-semantic-review`

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
