import { getTeamColor } from "@/shared/data/team-colors";

export function TeamRankCell({
  rank,
  teamName,
}: {
  rank: number;
  teamName: string;
}) {
  return (
    <td className="relative py-4 pl-6 pr-4 font-semibold">
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: getTeamColor(teamName) }}
      />
      {rank}
    </td>
  );
}
