import type { EventDetail, LeagueEvent } from "@/shared/data/types";

const events: LeagueEvent[] = [
  {
    slug: "spring-open-2026",
    name: "2026 春季公开赛",
    shortName: "春季公开赛",
    tagline: "城市巡回的年度揭幕站，兼顾赛事仪式感与竞技强度。",
    city: "台中",
    venue: "食茶竞技馆",
    startDate: "2026.03.12",
    endDate: "2026.03.16",
    players: 32,
    rounds: 18,
    status: "进行中",
    season: "2026 S1",
    coverAccent: "from-[#4a1010] to-[#7f1d1d]",
  },
  {
    slug: "summer-team-cup-2026",
    name: "2026 夏季团体杯",
    shortName: "夏季团体杯",
    tagline: "面向战队的团队赛制，强调轮转策略与积分运营。",
    city: "高雄",
    venue: "南方麻将会馆",
    startDate: "2026.06.20",
    endDate: "2026.06.22",
    players: 48,
    rounds: 12,
    status: "报名中",
    season: "2026 S2",
    coverAccent: "from-[#111827] to-[#1d4ed8]",
  },
  {
    slug: "masters-finals-2026",
    name: "2026 年度大师总决赛",
    shortName: "大师总决赛",
    tagline: "赛季积分前列选手汇聚的年终总决赛。",
    city: "台北",
    venue: "冠军舞台中心",
    startDate: "2026.11.08",
    endDate: "2026.11.10",
    players: 16,
    rounds: 10,
    status: "即将开始",
    season: "2026 Finals",
    coverAccent: "from-[#231f20] to-[#6b21a8]",
  },
];

export const eventDetails: Record<string, EventDetail> = {
  "spring-open-2026": {
    event: events[0],
    story:
      "2026 春季公开赛是本年度系列联赛的揭幕赛事，定位为品牌形象与竞技强度兼具的核心站点。页面设计需要同时承担赛事介绍、数据呈现与观众浏览的功能。",
    rules: [
      "采用四人半庄积分制，每轮结束更新总榜。",
      "预赛阶段共 15 轮，前 8 名进入决赛阶段。",
      "同分时依序比较平均顺位、单轮最高得点与对手强度。",
    ],
    schedule: [
      {
        id: "r1",
        title: "预赛第 1 轮",
        date: "03.12 10:00",
        stage: "预赛",
        summary: "选手签到后开始首轮编桌，更新初始积分。",
      },
      {
        id: "r2",
        title: "预赛第 6 轮",
        date: "03.13 14:00",
        stage: "预赛",
        summary: "进行中段积分洗牌，观察前八名变化。",
      },
      {
        id: "r3",
        title: "决赛桌",
        date: "03.16 18:30",
        stage: "决赛",
        summary: "前八名进入决赛阶段，争夺总冠军。",
      },
    ],
    matches: [
      {
        id: "m1",
        tableName: "A1 桌",
        roundLabel: "预赛第 5 轮",
        finishedAt: "03.13 11:40",
        players: ["林哲宇", "陈奕宏", "许佳颖", "王俊凯"],
        winner: "许佳颖",
        points: "+62.4",
      },
      {
        id: "m2",
        tableName: "B3 桌",
        roundLabel: "预赛第 5 轮",
        finishedAt: "03.13 11:45",
        players: ["黄柏霖", "张语晴", "李宗翰", "吴承恩"],
        winner: "黄柏霖",
        points: "+48.2",
      },
      {
        id: "m3",
        tableName: "C2 桌",
        roundLabel: "预赛第 6 轮",
        finishedAt: "03.13 15:10",
        players: ["陈佳音", "何承泽", "郭子晴", "蔡孟勋"],
        winner: "陈佳音",
        points: "+55.6",
      },
    ],
    ranking: [
      { rank: 1, name: "许佳颖", club: "南投雀会", totalPoints: 284, averagePlacement: 1.8, bonus: 20 },
      { rank: 2, name: "黄柏霖", club: "高雄流局社", totalPoints: 251, averagePlacement: 2.1, bonus: 16 },
      { rank: 3, name: "陈佳音", club: "台北牌研所", totalPoints: 237, averagePlacement: 2.2, bonus: 12 },
      { rank: 4, name: "林哲宇", club: "食茶竞技馆", totalPoints: 219, averagePlacement: 2.3, bonus: 10 },
      { rank: 5, name: "张语晴", club: "嘉义雀阵", totalPoints: 205, averagePlacement: 2.4, bonus: 8 },
    ],
    stats: [
      { label: "当前轮次", value: "第 6 / 18 轮", note: "赛程已进行三分之一" },
      { label: "最高单轮得点", value: "+62.4", note: "许佳颖 · 预赛第 5 轮" },
      { label: "平均对局时长", value: "47 分钟", note: "根据已完成 24 桌统计" },
      { label: "榜首领先", value: "33 分", note: "与第二名的积分差距" },
    ],
  },
  "summer-team-cup-2026": {
    event: events[1],
    story:
      "夏季团体杯主打战队叙事，首页展示更偏向报名与队伍介绍，赛事详情则强调对阵结构和团体积分。",
    rules: [
      "四支战队一组进行循环赛。",
      "团队总分由队员个人积分累加。",
      "淘汰赛阶段按小组排名编排对阵。",
    ],
    schedule: [
      {
        id: "s1",
        title: "报名截止",
        date: "06.01 23:59",
        stage: "准备阶段",
        summary: "提交战队名单与选手资料。",
      },
      {
        id: "s2",
        title: "小组抽签",
        date: "06.10 20:00",
        stage: "准备阶段",
        summary: "线上直播抽签分组。",
      },
    ],
    matches: [],
    ranking: [],
    stats: [
      { label: "报名战队", value: "12 支", note: "当前已完成报名审核" },
      { label: "候补选手", value: "18 名", note: "用于战队轮换与补报" },
    ],
  },
  "masters-finals-2026": {
    event: events[2],
    story:
      "大师总决赛承接赛季排行叙事，视觉上会更强调荣誉感与年终舞台氛围。",
    rules: [
      "仅开放赛季总积分前 16 名参赛。",
      "决赛阶段采用双日积分累计制。",
      "冠军将获得下一赛季一号种子资格。",
    ],
    schedule: [
      {
        id: "f1",
        title: "资格确认",
        date: "10.25 12:00",
        stage: "赛前阶段",
        summary: "确认参赛选手名单与递补顺位。",
      },
    ],
    matches: [],
    ranking: [],
    stats: [
      { label: "锁定席位", value: "16 / 16", note: "待公布完整签表" },
      { label: "赛季总奖金", value: "NT$ 300,000", note: "年终奖金池" },
    ],
  },
};

export { events };
