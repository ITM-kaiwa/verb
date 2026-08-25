"use client";

import { useState } from "react";
import ConjugationPractice from "@/components/ConjugationPractice";
import FallingVerbGame from "@/components/FallingVerbGame";
import MemoryMatchGame from "@/components/MemoryMatchGame";

type Mode = "practice" | "game" | "memory";

export default function Home() {
  const [mode, setMode] = useState<Mode>("practice");

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-8">
      <header className="mb-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <h1 className="font-kyokasho text-2xl text-kanjibrown sm:text-3xl">動詞活用練習</h1>
        <nav className="flex gap-2 rounded-full border border-sand-300 bg-sand-50 p-1 shadow-card">
          <TabButton active={mode === "practice"} onClick={() => setMode("practice")}>
            活用練習
          </TabButton>
          <TabButton active={mode === "game"} onClick={() => setMode("game")}>
            ミニゲーム
          </TabButton>
          <TabButton active={mode === "memory"} onClick={() => setMode("memory")}>
            神経衰弱
          </TabButton>
        </nav>
      </header>

      {mode === "practice" && <ConjugationPractice />}
      {mode === "game" && <FallingVerbGame />}
      {mode === "memory" && <MemoryMatchGame />}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-press rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        active ? "bg-sand-600 text-sand-50" : "text-sand-700 hover:bg-sand-200"
      }`}
    >
      {children}
    </button>
  );
}
