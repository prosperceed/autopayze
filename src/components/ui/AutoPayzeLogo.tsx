export default function AutoPayzeLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 64" role="img" aria-label="Autopayze" className={className} fill="none">
      <path d="M9 46 26 13c2-4 8-4 10 0l8 15-8 7-6-11-11 22H9Z" fill="currentColor" />
      <path d="m24 43 30-19-7 15 13-5-7 17-12-7-17 7Z" fill="currentColor" />
      <text x="76" y="43" fill="currentColor" fontFamily="var(--font-display), Inter, sans-serif" fontSize="33" fontWeight="700" letterSpacing="-1.8">Autopayze</text>
    </svg>
  );
}
