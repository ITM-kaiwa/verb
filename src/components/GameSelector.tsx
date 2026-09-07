"use client";

import { useState } from "react";
import FallingVerbGame from "@/components/FallingVerbGame";
import MemoryMatchGame from "@/components/MemoryMatchGame";
import SlashGame from "@/components/games/SlashGame";
import GroupSortGame from "@/components/games/GroupSortGame";
import FillBlankBattleGame from "@/components/games/FillBlankBattleGame";
import ComboRelayGame from "@/components/games/ComboRelayGame";
import AirCombatGame from "@/components/games/AirCombatGame";
import type { DataSourceSetting } from "@/lib/types";

type GameId = "matching" | "memory" | "slash" | "groupsort" | "battle" | "combo" | "aircombat";

const GAMES: { id: GameId; title: string; desc: string; emoji: string }[] = [
  { id: "matching", title: "Đoán thể chia", desc: "Bắt đúng thể chia của động từ đang rơi.", emoji: "🍃" },
  { id: "memory", title: "Lật thẻ trí nhớ", desc: "Đấu trí nhớ với máy tính, ghép ます形 với thể chia.", emoji: "🃏" },
  { id: "slash", title: "Chém thể chia", desc: "Chém đúng thẻ đáp án bay tới, né bẫy dễ nhầm.", emoji: "⚔️" },
  { id: "groupsort", title: "Phân loại nhóm động từ", desc: "Xếp động từ rơi xuống vào đúng nhóm I／II／III.", emoji: "🧩" },
  { id: "battle", title: "Đấu trường điền từ", desc: "Chọn đúng thể chia hợp ngữ cảnh để tấn công quái vật.", emoji: "⚔️" },
  { id: "combo", title: "Chuyền combo chia động từ", desc: "Trả lời liên tiếp thật nhanh để giữ combo.", emoji: "🎵" },
  { id: "aircombat", title: "Không chiến chia động từ", desc: "Lái máy bay, bắn hạ đúng thể chia giữa 4 máy bay địch bắn trả.", emoji: "🛩️" },
];

export default function GameSelector({
  dataSource,
  showVietnamese,
}: {
  dataSource: DataSourceSetting;
  showVietnamese: boolean;
}) {
  const [active, setActive] = useState<GameId | null>(null);

  if (!active) {
    return (
      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActive(g.id)}
            className="btn-press flex items-start gap-3 rounded-2xl border border-sand-300 bg-lemon-100 p-4 text-left shadow-card hover:bg-lemon-200"
          >
            <span className="text-2xl">{g.emoji}</span>
            <span>
              <span className="block font-semibold text-kanjibrown">{g.title}</span>
              <span className="mt-0.5 block text-xs text-sand-600">{g.desc}</span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setActive(null)}
        className="btn-press mb-3 rounded-full border border-sand-300 bg-sand-50 px-4 py-1.5 text-sm font-semibold text-sand-700 shadow-card hover:bg-sand-200"
      >
        ← Chọn trò chơi khác
      </button>

      {active === "matching" && <FallingVerbGame dataSource={dataSource} />}
      {active === "memory" && <MemoryMatchGame showVietnamese={showVietnamese} dataSource={dataSource} />}
      {active === "slash" && <SlashGame dataSource={dataSource} />}
      {active === "groupsort" && <GroupSortGame dataSource={dataSource} />}
      {active === "battle" && <FillBlankBattleGame />}
      {active === "combo" && <ComboRelayGame dataSource={dataSource} />}
      {active === "aircombat" && <AirCombatGame dataSource={dataSource} />}
    </div>
  );
}
