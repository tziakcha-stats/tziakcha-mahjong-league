export const DEFAULT_TEAM_NAME = "未匹配队伍";

export function parseMatchTitle(title) {
  const match = title.match(/(常规赛)第(.+?)轮([A-Z])桌/u);

  if (!match) {
    return {
      round: 0,
      roundLabel: title,
      tableName: "未知桌",
    };
  }

  const round = normalizeRoundNumber(match[2]);

  return {
    round,
    roundLabel: `${match[1]}第 ${round} 轮`,
    tableName: `${match[3]} 桌`,
  };
}

export function normalizeRoundNumber(value) {
  const chineseNumbers = new Map([
    ["一", 1],
    ["二", 2],
    ["三", 3],
    ["四", 4],
    ["五", 5],
    ["六", 6],
    ["七", 7],
    ["八", 8],
    ["九", 9],
    ["十", 10],
  ]);

  if (/^\d+$/u.test(value)) {
    return Number(value);
  }

  return chineseNumbers.get(value) ?? value;
}

export function formatRoundLabel(round) {
  return `常规赛第 ${round} 轮`;
}

export function formatFinishedAt(timestamp) {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return formatter.format(date).replace(/\//gu, "/");
}

export function formatScore(score) {
  return score > 0 ? `+${score}` : String(score);
}

export function formatRateNote(rounds, sourceLabel) {
  return `${rounds} 局样本，来源：${sourceLabel}`;
}
