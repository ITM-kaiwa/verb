"use client";

import { useState } from "react";
import ConjugationPractice from "@/components/ConjugationPractice";
import GameSelector from "@/components/GameSelector";
import TeachingMode from "@/components/TeachingMode";
import SettingsModal from "@/components/SettingsModal";
import PrintableVerbList from "@/components/PrintableVerbList";
import { verbsForSource } from "@/lib/verbData";
import type { DataSourceSetting } from "@/lib/types";

type Mode = "practice" | "games" | "teaching";

export default function Home() {
  const [mode, setMode] = useState<Mode>("practice");
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [dataSource, setDataSource] = useState<DataSourceSetting>("minna");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <main className="print:hidden mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-8">
        <header className="mb-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <h1 className="font-kyokasho text-2xl text-kanjibrown sm:text-3xl">Luyện tập chia động từ</h1>
          <div className="flex items-center gap-2">
            <nav className="flex gap-2 rounded-full border border-sand-300 bg-sand-50 p-1 shadow-card">
              <TabButton active={mode === "practice"} onClick={() => setMode("practice")}>
                Luyện tập
              </TabButton>
              <TabButton active={mode === "games"} onClick={() => setMode("games")}>
                Trò chơi
              </TabButton>
              <TabButton active={mode === "teaching"} onClick={() => setMode("teaching")}>
                Ngữ pháp
              </TabButton>
            </nav>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Cài đặt"
              title="Cài đặt"
              className="btn-press rounded-full border border-sand-300 bg-sand-50 p-2 text-lg text-sand-700 shadow-card hover:bg-sand-200"
            >
              ⚙
            </button>
          </div>
        </header>

        {mode === "practice" && (
          <ConjugationPractice
            showVietnamese={showVietnamese}
            onShowVietnameseChange={setShowVietnamese}
            dataSource={dataSource}
          />
        )}
        {mode === "games" && <GameSelector dataSource={dataSource} showVietnamese={showVietnamese} />}
        {mode === "teaching" && <TeachingMode />}
      </main>

      {settingsOpen && (
        <SettingsModal
          dataSource={dataSource}
          onDataSourceChange={setDataSource}
          onPrint={() => {
            setSettingsOpen(false);
            window.setTimeout(() => window.print(), 50);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <PrintableVerbList verbs={verbsForSource(dataSource)} showVietnamese={showVietnamese} />
    </>
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
