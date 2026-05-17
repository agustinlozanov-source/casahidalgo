export default function HeroIllustration() {
  return (
    <div className="aspect-[4/5] bg-gradient-to-br from-[#6b5d4a] to-[#3d342a] rounded-[18px] overflow-hidden shadow-[0_30px_80px_-30px_rgba(29,25,22,0.4)] relative">
      <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <pattern id="stone-hero" x="0" y="0" width="60" height="40" patternUnits="userSpaceOnUse">
            <rect width="60" height="40" fill="#5a4d3b" />
            <rect x="0" y="0" width="28" height="18" fill="#6b5d4a" rx="2" />
            <rect x="32" y="0" width="26" height="18" fill="#4f4232" rx="2" />
            <rect x="0" y="22" width="22" height="16" fill="#574934" rx="2" />
            <rect x="26" y="22" width="32" height="16" fill="#665646" rx="2" />
          </pattern>
        </defs>
        <rect width="400" height="500" fill="url(#stone-hero)" />
        <rect x="40" y="180" width="180" height="220" fill="#4a5c3a" rx="4" />
        <rect x="60" y="210" width="140" height="90" fill="#e8e2d0" rx="2" />
        <text x="130" y="262" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="16" fontStyle="italic" fill="#1d1916">
          Casa Hidalgo
        </text>
        <rect x="60" y="400" width="280" height="14" fill="#2a221a" rx="2" />
        <rect x="80" y="420" width="36" height="50" fill="#1a1410" rx="3" />
        <rect x="130" y="420" width="36" height="50" fill="#1a1410" rx="3" />
        <rect x="180" y="420" width="36" height="50" fill="#1a1410" rx="3" />
        <rect x="230" y="420" width="36" height="50" fill="#1a1410" rx="3" />
        <rect x="280" y="420" width="36" height="50" fill="#1a1410" rx="3" />
        <rect x="0" y="0" width="400" height="14" fill="#2a201a" />
        <rect x="40" y="0" width="14" height="170" fill="#3a2e22" />
        <rect x="170" y="0" width="14" height="170" fill="#3a2e22" />
        <rect x="300" y="0" width="14" height="170" fill="#3a2e22" />
      </svg>
    </div>
  );
}
