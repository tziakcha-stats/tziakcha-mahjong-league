import teams from "../../../data/sw_league/team.json" with { type: "json" };

export const FALLBACK_TEAM_COLOR = "#d6d3d1";

const teamColors = new Map(
  teams.map((team) => [team.teamName, team.color ?? FALLBACK_TEAM_COLOR]),
);

export function getTeamColor(teamName) {
  return teamColors.get(teamName) ?? FALLBACK_TEAM_COLOR;
}
