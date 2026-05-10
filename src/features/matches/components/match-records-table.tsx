"use client";

import type { MatchRecord } from "@/shared/data/types";
import { cn } from "@/lib/utils";
import { getTeamColor } from "@/shared/data/team-colors";
import { SectionHeading } from "@/shared/ui/section-heading";
import { useMemo, useState } from "react";

const placementLabels = ["一位", "二位", "三位", "四位"] as const;
const PAGE_SIZE = 20;
const allPlayersValue = "__all_players__";
const allTeamsValue = "__all_teams__";

function getUniqueSortedValues(values: string[]) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "zh-Hans-CN", { numeric: true }),
  );
}

export function MatchRecordsTable({ matches }: { matches: MatchRecord[] }) {
  const [selectedPlayer, setSelectedPlayer] = useState(allPlayersValue);
  const [selectedTeam, setSelectedTeam] = useState(allTeamsValue);
  const [currentPage, setCurrentPage] = useState(1);

  const playerOptions = useMemo(
    () => getUniqueSortedValues(matches.flatMap((match) => match.placements.map((placement) => placement.player))),
    [matches],
  );
  const teamOptions = useMemo(
    () => getUniqueSortedValues(matches.flatMap((match) => match.placements.map((placement) => placement.team))),
    [matches],
  );
  const filteredMatches = useMemo(
    () =>
      matches.filter((match) => {
        const matchesPlayer =
          selectedPlayer === allPlayersValue ||
          match.placements.some((placement) => placement.player === selectedPlayer);
        const matchesTeam =
          selectedTeam === allTeamsValue ||
          match.placements.some((placement) => placement.team === selectedTeam);

        return matchesPlayer && matchesTeam;
      }),
    [matches, selectedPlayer, selectedTeam],
  );
  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedMatches = filteredMatches.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );
  const isFilterActive =
    selectedPlayer !== allPlayersValue || selectedTeam !== allTeamsValue;

  function updatePlayerFilter(value: string) {
    setSelectedPlayer(value);
    setCurrentPage(1);
  }

  function updateTeamFilter(value: string) {
    setSelectedTeam(value);
    setCurrentPage(1);
  }

  function isPlacementHighlighted(placement: MatchRecord["placements"][number]) {
    const matchesPlayer =
      selectedPlayer !== allPlayersValue && placement.player === selectedPlayer;
    const matchesTeam = selectedTeam !== allTeamsValue && placement.team === selectedTeam;

    return matchesPlayer || matchesTeam;
  }

  return (
    <section className="surface-card rounded-[30px] border border-line p-6">
      <SectionHeading eyebrow="对局记录" title="所有对局记录" />

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <label className="flex min-w-48 flex-col gap-2 text-sm font-medium text-[#6f675d]">
          包含玩家
          <select
            className="h-11 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-foreground outline-none transition focus:border-brand"
            value={selectedPlayer}
            onChange={(event) => updatePlayerFilter(event.target.value)}
          >
            <option value={allPlayersValue}>全部玩家</option>
            {playerOptions.map((player) => (
              <option key={player} value={player}>
                {player}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-48 flex-col gap-2 text-sm font-medium text-[#6f675d]">
          包含队伍
          <select
            className="h-11 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-foreground outline-none transition focus:border-brand"
            value={selectedTeam}
            onChange={(event) => updateTeamFilter(event.target.value)}
          >
            <option value={allTeamsValue}>全部队伍</option>
            {teamOptions.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>
        <p className="pb-2 text-sm text-[#6f675d]">
          共 {filteredMatches.length} 场，当前第 {safeCurrentPage} / {totalPages} 页
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] border border-line">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-black/[0.03] text-[#6f675d]">
            <tr>
              <th className="px-4 py-3 font-medium">轮次</th>
              <th className="px-4 py-3 font-medium">桌次</th>
              {placementLabels.map((label) => (
                <th key={label} className="px-4 py-3 font-medium">
                  {label}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">完成时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white/80">
            {paginatedMatches.length ? (
              paginatedMatches.map((match) => (
                <tr key={match.id}>
                  <td className="px-4 py-4 text-[#6f675d]">{match.round}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold">{match.tableName}</div>
                    {match.replayUrl ? (
                      <a
                        className="mt-1 inline-flex text-xs font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700"
                        href={match.replayUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        链接
                      </a>
                    ) : null}
                  </td>
                  {match.placements.map((placement) => (
                    <td
                      key={placement.placement}
                      className={cn(
                        "relative px-4 py-4 align-top transition-opacity after:pointer-events-none after:absolute after:inset-0 after:transition-colors",
                        isFilterActive &&
                          !isPlacementHighlighted(placement) &&
                          "opacity-45 after:bg-gray-100/35",
                      )}
                    >
                      <div
                        className="absolute inset-x-0 top-0 h-1.5"
                        style={{ backgroundColor: getTeamColor(placement.team) }}
                      />
                      <div className="font-semibold text-foreground">{placement.player}</div>
                      <div className="mt-1 text-xs text-[#6f675d]">{placement.team}</div>
                      <div className="mt-2 font-semibold text-brand">{placement.scoreLabel}</div>
                    </td>
                  ))}
                  <td className="px-4 py-4 text-[#6f675d]">{match.finishedAt}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#6f675d]">
                  {matches.length ? "没有符合筛选条件的对局记录。" : "当前赛事尚未产生对局记录。"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#6f675d]">
          显示第 {filteredMatches.length ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0}-
          {Math.min(safeCurrentPage * PAGE_SIZE, filteredMatches.length)} 场
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-foreground transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-45"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            上一页
          </button>
          <button
            type="button"
            className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-foreground transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-45"
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            下一页
          </button>
        </div>
      </div>
    </section>
  );
}
