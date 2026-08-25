"use client";

import type { DataSourceSetting } from "@/lib/types";

interface Props {
  dataSource: DataSourceSetting;
  onDataSourceChange: (v: DataSourceSetting) => void;
  onPrint: () => void;
  onClose: () => void;
}

const SOURCE_OPTIONS: { value: DataSourceSetting; label: string }[] = [
  { value: "both", label: "両方（みんなの日本語＋いろどり）" },
  { value: "minna", label: "みんなの日本語のみ" },
  { value: "irodori", label: "いろどりのみ" },
];

export default function SettingsModal({
  dataSource,
  onDataSourceChange,
  onPrint,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-kanjibrown/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-sand-300 bg-sand-50 p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-kyokasho text-xl text-kanjibrown">設定</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="btn-press rounded-full px-2 py-1 text-sand-600 hover:bg-sand-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 text-sm text-sand-700">
          <div>
            <p className="mb-2 font-semibold text-sand-700">動詞データの範囲</p>
            <div className="space-y-1.5">
              {SOURCE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="data-source"
                    value={opt.value}
                    checked={dataSource === opt.value}
                    onChange={() => onDataSourceChange(opt.value)}
                    className="h-4 w-4 accent-sand-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onPrint}
            className="btn-press w-full rounded-full bg-sand-600 px-4 py-2 text-sm font-semibold text-sand-50 shadow hover:brightness-95"
          >
            全動詞の活用形一覧を印刷
          </button>
        </div>
      </div>
    </div>
  );
}
