# Keep / BookStack 组合约束扩展

修订：`2026-11-08-keep-bookstack-interactions`。父版 `2026-11-07-bookstack-lifecycle` 的需求、场景和测试标题保持原有身份。新增场景通过公开界面建立数据，不向应用注入私有状态。Keep 使用同一工作区的两页；BookStack 使用现有两个验证账号和独立匿名会话。操作顺序固定，测试不靠延时制造冲突。

| 题目 / 需求 | 基础能力 | 新场景和关键失败模式 |
| --- | --- | --- |
| Keep REQ-6.1 | 两条同名笔记独立显示、搜索和切换布局（01） | 按正文选中正确对象；在标签视图改名，另一条经归档、删除、恢复和取消归档后保留正文、标签、颜色、置顶（02） |
| Keep REQ-6.2 | 既有 REQ-3.3 标签删除 | 重建同名标签后，过期编辑、恢复和取消归档都不能复活旧关联；显式重新分配只影响指定笔记（01） |
| Keep REQ-6.3 | 既有 REQ-2.4 删除及 Undo | 在标签改名及另一笔记保存后撤销删除，不回滚后续修改或恢复旧标签名（01） |
| Keep REQ-6.4 | 既有 REQ-2.3 编辑保存 | 合并独立字段（01）；冲突保留输入并能加载新版（02）；明确覆盖只改本次字段（03）；删除后旧窗口不能复活记录（04） |
| BookStack REQ-11.1 | 单作者保存私有修订并发布，检查匿名阅读、搜索、最近更新和收藏（01） | 双作者的草稿互不泄露，后发布者基于旧版本时必须处理冲突（02） |
| BookStack REQ-11.2 | 单章节跨书移动、旧书签及面包屑（01） | 两个同名章节与同名页面都保留，明确放到首位，校验章节内顺序、导航、收藏和最近浏览（02） |
| BookStack REQ-11.3 | 既有 REQ-6.4 发布及 REQ-10.1 删除 | 较新发布不被静默覆盖（01）；移动后的旧编辑器只更新新位置中的同一对象（02）；已删除页面不能被旧保存复活（03） |

暂缓 Keep 清单项身份与排序、BookStack 权限继承与版本历史。合成浏览器合同只验证定位和观察边界；新业务场景需要符合本修订的候选应用才能执行。历史参考应用的分数不迁移。

从 ShallowCode 实验分支运行配对实验，两种方法使用同一冻结题面。以下命令会调用已配置的模型：

```powershell
cd E:\shallow\shallow-code
npm.cmd run experiment -- run --bench-root E:\shallow\arc-bench-ext --tasks keep,bookstack --methods baseline,shallow --repeats 1
```

每个候选评分目录中的 `cases.json` 和 `playwright.json` 可用于分组统计。从 ARC-Bench Ext 根目录执行：

```powershell
node validation/summarize-interactions.mjs keep <evaluation-N目录>
node validation/summarize-interactions.mjs bookstack <evaluation-N目录>
```

报告分别给出既有场景、新增基础场景、新增交互场景的通过数、总数、失败、跳过和未执行数，以及新增场景的逐条状态。通过率始终用组内完整清单作分母。正式比较时按相同题目、重复轮次与冻结配置配对；评测执行错误单列。
