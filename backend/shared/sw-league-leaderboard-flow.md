# SW 联赛分析榜单生成流程

本文记录本项目新增分析榜单时应沿用的流程。重点是本仓库的数据形态和生成链路，不重复通用前端或 Node.js 知识。

## 总体链路

本项目的分析榜单优先在生成阶段完成计算，再由前端读取静态 JSON 展示。

固定链路如下：

1. 在 `backend/shared/sw-league-generator.mjs` 读取原始数据并生成 leaderboard。
2. 在 `generateSwLeagueContent()` 的 `leaderboards` 对象中挂载新字段。
3. 在 `backend/generate/sw-league.mjs` 写出 `content/generated/sw-league/leaderboards/*.json`。
4. 在 `src/shared/data/repositories.ts` 导入生成后的 JSON。
5. 在 `src/shared/data/types.ts` 补充类型。
6. 在 `src/features/ranking/components/analysis-panel.tsx` 增加分析 tab 或表格展示。

这样做可以让页面只负责展示，避免在 App Router 页面或客户端组件里重新读取详细牌谱。

## 详细牌谱来源

需要按小局、和牌、番种明细统计的榜单，应复用 `buildDetailedSessions()`。

该函数会把：

- `historyRows` 中的比赛基础信息
- `sessionRows` 中每场比赛对应的 record id
- `data/sw_league/records/*.json` 中的详细牌谱

合并成 `detailedSessions`。

随后用 `tziakcha-fetcher/record/win` 提供的 `extractTziakchaRoundWinInfos(session)` 取得和牌信息。当前大牌榜、局收支、凑番榜都走这条链路。

## 和牌记录字段

从 `extractTziakchaRoundWinInfos()` 取得的和牌信息通常需要补齐这些项目字段：

- `winner`：通过 `resolvePlayerName()` 处理别名后的和牌家。
- `winnerTeam`：通过 `playerTeamIndex` 查队伍，缺失时使用 `DEFAULT_TEAM_NAME`。
- `totalFan`：该和牌总番数。
- `fanItems` 或派生出的番种明细。
- `roundLabel`、`tableName`：通过 `parseMatchTitle(match.title)` 取得。
- `replayUrl`：用 `OFFICIAL_REPLAY_BASE_URL + match.id` 拼接。
- `matchId`、`recordId`、`roundNo`：用于稳定定位小局。
- `finishedAt`：用 `formatFinishedAt(match.finish_time)` 格式化。

如果榜单会在前端链接到对局，应保留 `replayUrl`。如果需要稳定排序，同一时间内应继续比较 `roundNo` 和选手名。

## 大牌榜模式

大牌榜的实现位置是 `buildBigWinLeaderboard()`。

它的处理方式：

- 遍历所有详细和牌。
- 对每个和牌家生成一行。
- `description` 只列出 `unitFan >= 8` 的番种。
- 按 `totalFan` 从高到低排序。
- 只保留前 20 条。

适合“从全部和牌中截取最高值”的榜单。

## 凑番榜模式

凑番榜沿用大牌榜的数据入口，但不截取前 20，也不按总番数排序。

本项目当前口径：

- 只统计最大单项番数不超过 2 的和牌。
- 按 2 番番种数量分组：
  - `gold`：0 个 2 番，页面显示金8。
  - `silver`：1 个 2 番，页面显示银8。
  - `bronze`：2 个 2 番，页面显示铜8。
  - `iron`：3 个及以上 2 番，页面显示铁8。
- 金8说明：
  - `幺九刻` 数量至少 2 时显示 `金II`。
  - 否则显示 `金I`。
- 其他组的说明展开所有 2 番番名，并保留重复项。

这里没有使用“总番数必须等于 8”的条件。当前需求只看凑番结构，不限制最终总番数。

注意：用户原始说法里有“最大番数=2”和“金8没有2番”。为了让金8成立，生成逻辑按“最大单项番数不超过 2”处理；否则没有 2 番的和牌不可能满足最大番数等于 2。

## 排序

本项目生成的 `finishedAt` 是 `MM/DD HH:mm` 字符串。当前赛季数据在同一年内，字符串排序可用于从旧到新或从新到旧。

需要从旧到新时使用：

1. `finishedAt` 升序。
2. `roundNo` 升序。
3. `winner` 按中文 locale 排序。

如果以后跨年或跨赛季混排，应改用原始 `match.finish_time` 保存排序字段，不要继续依赖 `finishedAt` 字符串。

## 空数据

分析榜单不能假设每个分组都有数据。

凑番榜当前实际生成结果中，金8可能为空。前端表格应对空数组显示空状态，而不是隐藏整组，也不要让 `Object.keys()` 或表格行渲染依赖非空数据。

## 测试位置

生成逻辑测试放在 `backend/generate/sw-league.test.mjs`。

前端结构测试放在 `src/features/ranking/components/analysis-panel.test.mjs`。

生成端测试应优先覆盖：

- 新 leaderboard 字段存在。
- 分类或筛选条件正确。
- 排序方向正确。
- 空分组可以存在。
- 番种说明符合本项目口径。

前端测试应覆盖：

- tab 文案存在。
- 表格组件存在。
- 表头和空状态存在。
- 页面读取的是 `leaderboards` 中生成好的数据。

## 生成文件

新增 leaderboard 后，需要同时更新：

- `backend/generate/sw-league.mjs` 的 `writeJson()`。
- 同文件末尾的输出日志。
- `content/generated/sw-league/leaderboards/*.json`。

生成命令：

```bash
npm run generate:sw-league
```

生成后的 JSON 是前端运行时数据源，应随代码一起检查差异。
