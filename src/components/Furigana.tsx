export default function Furigana({ kanji, reading, className }: { kanji: string; reading: string; className?: string }) {
  return (
    <ruby className={className}>
      {kanji}
      <rt className="text-[0.55em] font-normal text-sand-500">{reading}</rt>
    </ruby>
  );
}
