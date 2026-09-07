"use client";

import { useState } from "react";

export default function HelpButton({ title, body }: { title: string; body: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Hướng dẫn chơi"
        title="Hướng dẫn chơi"
        className="btn-press flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sand-300 bg-sand-50 text-sm font-bold text-sand-600 shadow-card hover:bg-sand-200"
      >
        ？
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-kanjibrown/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-3xl border border-sand-300 bg-sand-50 p-5 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <h2 className="font-kyokasho text-lg text-kanjibrown">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="btn-press rounded-full px-2 py-1 text-sand-600 hover:bg-sand-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto text-sm text-sand-700">
              {body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
