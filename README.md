# ARC-Bench modified

本目录包含 8 个 Web 应用的需求、参考图片、Playwright 场景及验收器回归。当前修订 `2026-11-07-per-task-semantic-review`，来源和冻结文件见 [revision.json](revision.json)。逐题审查、变更依据与未决项见 [audit/README.md](audit/README.md)。

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
| 合计 | 408 | 714 |

生成比较在同版 ShallowCode 中执行：

```powershell
npm run experiment -- run --bench-root E:\my-works\coding\ShallowCode\outputs\arc-bench-reviewed-20261107 --tasks stackoverflow --methods baseline,shallow --repeats 1
```

已有产物可单独重验，输出目录必须新建，应用必须声明 shallowcode.config.json：

```powershell
node E:\my-works\coding\ShallowCode\outputs\arc-bench-reviewed-20261107\evaluate-project.mjs E:\my-works\coding\ShallowCode stackoverflow <应用目录> <新评测目录> baseline
```

入口先验证冻结的控制器和单题输入，保存 manifest，再收集测试并逐场景评测。方法参数支持 baseline / shallow / arc；它只选择运行合同兼容方式，不调用生成模型。退出码 0 表示全部通过、1 表示存在业务失败、2 表示执行错误。正式运行须保留新目录中的 manifest.json、evaluation/evaluation.json、cases.json、逐场景报告/日志/浏览器产物。

每个场景启动独立应用和数据副本，整个场景内的浏览器上下文共享该服务。构建和安装在源码未变时复用。初始账户、业务对象及固定时钟由需求声明并由应用初始化。预算为 1 worker、0 retry、60 秒场景超时、10 秒断言、15 秒动作、30 秒导航；跨场景隔离开销独立记录。setup-playwright.ps1 / .sh / .cjs 可以生成浏览器配置，直接整题 npm run test:e2e 适合手动诊断，不能代替上述隔离评测。

验证 benchmark 自身时，在本目录安装固定依赖后执行：

```powershell
npm install --no-audit --no-fund
npx playwright install chromium
npm run typecheck
npm run test:contracts
npm run test:collect
npm run test:inputs
npm run test:closeout
```

[audit/README.md](audit/README.md) 汇集本轮八题的逐场景审查矩阵；[CONSISTENCY.md](CONSISTENCY.md) 保留前轮收口依据；[QUALITY.md](QUALITY.md) 说明证据范围；[validation.json](validation.json) 登记本版验证结果。场景收集、合同回归和合成应用探针均不代表八题真实应用通过率。父版清单另存于 audit/parent-revision.json，旧成绩不迁移至本版。这里是 ARC-Bench 的派生修订版，应与上游原版区分报告。
