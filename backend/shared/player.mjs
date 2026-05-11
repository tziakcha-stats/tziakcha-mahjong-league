import fs from "node:fs/promises";
import path from "node:path";

import { createFraction, addFractions } from "./fraction.mjs";
import { readJson, toNumber } from "./sw-league-utils.mjs";

export async function readPlayerAliases(projectRoot) {
  const playerRoot = path.join(projectRoot, "data", "sw_league", "player");
  const aliases = {};
  let files;

  try {
    files = await fs.readdir(playerRoot);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return aliases;
    }

    throw error;
  }

  for (const fileName of files) {
    if (!fileName.endsWith(".json")) {
      continue;
    }

    const player = await readJson(path.join(playerRoot, fileName));
    const currentName = player.name;

    if (!currentName) {
      continue;
    }

    for (const alias of player.alias_history ?? []) {
      if (alias.name && alias.name !== currentName) {
        aliases[alias.name] = currentName;
      }
    }
  }

  return aliases;
}

export function resolvePlayerName(playerName, aliases = {}) {
  return aliases[playerName] ?? playerName;
}

export function buildPlayerIndex(teamRows, aliases = {}) {
  const index = new Map();

  for (const team of teamRows) {
    const players = [team.captain, team.member1, team.member2, team.member3].filter(Boolean);

    for (const playerName of players) {
      index.set(resolvePlayerName(playerName, aliases), {
        teamId: String(team.id),
        teamName: team.teamName,
      });
    }
  }

  return index;
}

export function buildPenaltyMaps(penalties, aliases) {
  const playerPenalties = new Map();
  const teamPenalties = new Map();

  for (const penalty of penalties.playerPenalties ?? []) {
    const playerName = resolvePlayerName(penalty.player, aliases);
    const current = playerPenalties.get(playerName) ?? createFraction(0);
    playerPenalties.set(
      playerName,
      addFractions(current, createFraction(toNumber(penalty.standardPointPenalty))),
    );
  }

  for (const penalty of penalties.teamPenalties ?? []) {
    const current = teamPenalties.get(penalty.team) ?? createFraction(0);
    teamPenalties.set(
      penalty.team,
      addFractions(current, createFraction(toNumber(penalty.standardPointPenalty))),
    );
  }

  return { playerPenalties, teamPenalties };
}
