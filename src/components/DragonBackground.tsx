export default function DragonBackground() {
  return (
    <div className="dragon-bg" aria-hidden="true">
      {/* Deep ambient fire glow layers */}
      <div className="dragon-orb dragon-orb-1" />
      <div className="dragon-orb dragon-orb-2" />
      <div className="dragon-orb dragon-orb-3" />

      {/* Ember sparks floating globally */}
      <div className="global-embers">
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="g-ember" style={{ '--gi': i } as React.CSSProperties} />
        ))}
      </div>

      {/* The Dragon */}
      <div className="dragon-container">

        {/* Fire breath embers */}
        <div className="fire-trail">
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} className="ember" style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>

        <svg
          className="dragon-svg"
          viewBox="0 0 520 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="bodyGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7A1A08" />
              <stop offset="60%" stopColor="#4A0E04" />
              <stop offset="100%" stopColor="#1A0302" />
            </radialGradient>
            <radialGradient id="wingGrad" cx="30%" cy="20%" r="70%">
              <stop offset="0%" stopColor="#8B1A0A" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#4A0E04" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1A0302" stopOpacity="0.5" />
            </radialGradient>
            <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="40%" stopColor="#FF8A20" />
              <stop offset="100%" stopColor="#FF2200" />
            </radialGradient>
            <radialGradient id="bigGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF5A3C" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FF5A3C" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFEE44" />
              <stop offset="25%" stopColor="#FF8A20" />
              <stop offset="60%" stopColor="#FF5A3C" />
              <stop offset="100%" stopColor="#FF5A3C" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="fireGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF8A20" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF5A3C" stopOpacity="0" />
            </linearGradient>
            <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="fireFilter" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="4" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* === MEGA GLOW HALO === */}
          <ellipse cx="260" cy="160" rx="200" ry="100" fill="url(#bigGlow)" opacity="0.6" />

          {/* === UPPER WING (dominant) === */}
          <g className="wing-left">
            {/* Wing membrane */}
            <path
              d="M230 145 C200 80, 140 30, 60 10 C30 3, 5 8, 0 20 C40 25, 90 45, 130 75 C165 100, 195 125, 225 148Z"
              fill="url(#wingGrad)"
              filter="url(#softGlow)"
            />
            {/* Wing edge glow */}
            <path
              d="M230 145 C200 80, 140 30, 60 10 C30 3, 5 8, 0 20"
              stroke="#FF5A3C"
              strokeWidth="1.5"
              strokeOpacity="0.7"
              fill="none"
            />
            {/* Vein 1 */}
            <path d="M228 148 C195 90, 145 50, 80 25" stroke="#FF5A3C" strokeWidth="1" strokeOpacity="0.5" fill="none" />
            {/* Vein 2 */}
            <path d="M224 150 C196 100, 158 68, 108 48" stroke="#FF5A3C" strokeWidth="0.7" strokeOpacity="0.35" fill="none" />
            {/* Vein 3 */}
            <path d="M220 152 C200 112, 170 88, 140 72" stroke="#FF5A3C" strokeWidth="0.5" strokeOpacity="0.25" fill="none" />
            {/* Wing claw tips */}
            <path d="M60 10 C55 4, 48 0, 44 4" stroke="#FF5A3C" strokeWidth="1.2" strokeOpacity="0.6" fill="none" strokeLinecap="round" />
            <path d="M0 20 C-4 14, -6 8, -2 5" stroke="#FF5A3C" strokeWidth="1" strokeOpacity="0.5" fill="none" strokeLinecap="round" />
          </g>

          {/* === LOWER WING === */}
          <g className="wing-right">
            <path
              d="M245 175 C215 230, 150 265, 65 260 C30 258, 5 248, 0 238 C40 238, 95 232, 140 215 C180 200, 215 185, 243 173Z"
              fill="url(#wingGrad)"
              filter="url(#softGlow)"
              opacity="0.9"
            />
            <path
              d="M245 175 C215 230, 150 265, 65 260 C30 258, 5 248, 0 238"
              stroke="#FF5A3C"
              strokeWidth="1.2"
              strokeOpacity="0.6"
              fill="none"
            />
            <path d="M242 176 C214 225, 158 258, 90 258" stroke="#FF5A3C" strokeWidth="0.8" strokeOpacity="0.4" fill="none" />
            <path d="M238 178 C214 220, 170 250, 118 252" stroke="#FF5A3C" strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
            <path d="M65 260 C60 266, 54 270, 50 266" stroke="#FF5A3C" strokeWidth="1" strokeOpacity="0.5" fill="none" strokeLinecap="round" />
          </g>

          {/* === TAIL === */}
          <path
            d="M290 185 C330 196, 370 198, 405 188 C428 181, 445 168, 458 153 C470 138, 476 122, 480 106 C483 93, 481 80, 475 74"
            stroke="#3A0D05"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M290 185 C330 196, 370 198, 405 188 C428 181, 445 168, 458 153 C470 138, 476 122, 480 106 C483 93, 481 80, 475 74"
            stroke="#6B1A0A"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M290 185 C330 196, 370 198, 405 188 C428 181, 445 168, 458 153 C470 138, 476 122, 480 106 C483 93, 481 80, 475 74"
            stroke="#FF5A3C"
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.5"
            fill="none"
          />
          {/* Tail spike */}
          <path d="M475 74 C480 64, 492 55, 486 46 C478 53, 468 63, 475 74Z" fill="#6B1A0A" stroke="#FF5A3C" strokeWidth="1" strokeOpacity="0.7" />
          <path d="M475 74 C478 68, 486 60, 482 52" stroke="#FF8A6B" strokeWidth="0.6" strokeOpacity="0.5" fill="none" />
          {/* Tail ridge spikes */}
          {[0.2, 0.38, 0.55, 0.7, 0.82].map((t, i) => {
            const x = 290 + t * 190
            const y = 185 - t * 111
            return (
              <path
                key={i}
                d={`M${x} ${y} L${x - 5 + i} ${y - 12} L${x + 5} ${y}`}
                fill="#4A0E04"
                stroke="#FF5A3C"
                strokeWidth="0.6"
                strokeOpacity="0.5"
              />
            )
          })}

          {/* === MAIN BODY === */}
          <ellipse cx="265" cy="168" rx="60" ry="30" fill="#3A0D05" filter="url(#softGlow)" />
          <ellipse cx="265" cy="168" rx="58" ry="28" fill="#5A1208" />
          <ellipse cx="265" cy="168" rx="58" ry="28" stroke="#FF5A3C" strokeWidth="0.8" strokeOpacity="0.4" fill="none" />
          {/* Body scale lines */}
          <path d="M225 162 C240 155, 258 153, 275 156" stroke="#FF5A3C" strokeWidth="0.6" strokeOpacity="0.35" fill="none" />
          <path d="M228 170 C245 163, 262 161, 280 164" stroke="#FF5A3C" strokeWidth="0.6" strokeOpacity="0.3" fill="none" />
          <path d="M232 178 C250 172, 268 170, 286 173" stroke="#FF5A3C" strokeWidth="0.5" strokeOpacity="0.25" fill="none" />
          {/* Belly plates */}
          <path d="M235 172 C250 176, 265 177, 280 175 C270 180, 255 181, 240 179Z" fill="#2A0804" stroke="#FF5A3C" strokeWidth="0.4" strokeOpacity="0.2" />

          {/* === NECK === */}
          <path
            d="M212 155 C198 143, 188 130, 184 116 C180 103, 183 90, 190 82"
            stroke="#3A0D05"
            strokeWidth="22"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M212 155 C198 143, 188 130, 184 116 C180 103, 183 90, 190 82"
            stroke="#5A1208"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M212 155 C198 143, 188 130, 184 116 C180 103, 183 90, 190 82"
            stroke="#FF5A3C"
            strokeWidth="0.8"
            strokeOpacity="0.4"
            fill="none"
          />
          {/* Neck scales */}
          <path d="M206 150 C196 140, 187 128, 183 115" stroke="#FF5A3C" strokeWidth="0.5" strokeOpacity="0.3" fill="none" strokeDasharray="3 4" />
          {/* Neck ridge */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const x = 212 - t * 22
            const y = 155 - t * 73
            return <circle key={i} cx={x} cy={y} r="2.5" fill="#4A0E04" stroke="#FF5A3C" strokeWidth="0.5" strokeOpacity="0.5" />
          })}

          {/* === HEAD === */}
          <ellipse cx="200" cy="72" rx="26" ry="17" fill="#3A0D05" filter="url(#softGlow)" />
          <ellipse cx="200" cy="72" rx="24" ry="15" fill="#5A1208" />
          <ellipse cx="200" cy="72" rx="24" ry="15" stroke="#FF5A3C" strokeWidth="1" strokeOpacity="0.6" fill="none" />

          {/* Snout */}
          <path d="M176 69 C166 66, 156 68, 150 73 C156 77, 166 76, 176 74Z" fill="#4A0E04" stroke="#FF5A3C" strokeWidth="0.8" strokeOpacity="0.6" />
          {/* Upper jaw */}
          <path d="M176 68 C164 64, 153 65, 147 70" stroke="#FF5A3C" strokeWidth="0.7" strokeOpacity="0.5" fill="none" />
          {/* Lower jaw */}
          <path d="M176 74 C164 78, 153 78, 147 74" stroke="#FF5A3C" strokeWidth="0.6" strokeOpacity="0.4" fill="none" />
          {/* Teeth */}
          {[152, 157, 162, 167, 172].map((x, i) => (
            <path key={i} d={`M${x} 70 L${x - 1} 74 L${x + 2} 70`} fill="#8B1A0A" stroke="#FF8A6B" strokeWidth="0.4" strokeOpacity="0.6" />
          ))}
          {/* Nostrils */}
          <ellipse cx="153" cy="68" rx="2" ry="1.2" fill="#FF5A3C" opacity="0.8" />
          <ellipse cx="159" cy="67" rx="1.5" ry="1" fill="#FF5A3C" opacity="0.6" />

          {/* === HORNS === */}
          {/* Main horn */}
          <path d="M204 58 C207 44, 212 30, 210 18" stroke="#4A0E04" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M204 58 C207 44, 212 30, 210 18" stroke="#8B1A0A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M204 58 C207 44, 212 30, 210 18" stroke="#FF5A3C" strokeWidth="0.8" strokeOpacity="0.7" fill="none" strokeLinecap="round" />
          <circle cx="210" cy="17" r="2.5" fill="#FF8A6B" filter="url(#softGlow)" />
          {/* Secondary horn */}
          <path d="M214 63 C218 52, 222 42, 220 34" stroke="#3A0D05" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M214 63 C218 52, 222 42, 220 34" stroke="#FF5A3C" strokeWidth="0.6" strokeOpacity="0.5" fill="none" strokeLinecap="round" />
          <circle cx="220" cy="33" r="1.5" fill="#FF5A3C" opacity="0.7" />
          {/* Ear spike */}
          <path d="M218 68 C224 62, 228 56, 226 50" stroke="#4A0E04" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M218 68 C224 62, 228 56, 226 50" stroke="#FF5A3C" strokeWidth="0.5" strokeOpacity="0.4" fill="none" strokeLinecap="round" />

          {/* === EYE === */}
          <ellipse cx="190" cy="68" rx="6" ry="5" fill="#0B0D12" filter="url(#strongGlow)" />
          <ellipse cx="190" cy="68" rx="5" ry="4" fill="url(#eyeGlow)" className="dragon-eye" />
          {/* Slit pupil */}
          <ellipse cx="190" cy="68" rx="1.5" ry="3.5" fill="#0B0D12" />
          {/* Eye glow aura */}
          <ellipse cx="190" cy="68" rx="9" ry="7" fill="#FF5A3C" opacity="0.12" className="dragon-eye" />
          <ellipse cx="190" cy="68" rx="12" ry="10" fill="#FF8A20" opacity="0.06" className="dragon-eye" />
          {/* Brow */}
          <path d="M184 62 C188 59, 195 59, 198 62" stroke="#FF5A3C" strokeWidth="1.2" strokeOpacity="0.6" fill="none" />

          {/* === FIRE BREATH === */}
          <g filter="url(#fireFilter)" className="dragon-fire">
            {/* Outer diffuse flame */}
            <path
              d="M147 73 C125 80, 100 82, 70 78 C45 73, 20 60, 0 45"
              stroke="#FF5A3C"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
              opacity="0.25"
            />
            {/* Mid flame */}
            <path
              d="M147 72 C122 72, 95 68, 68 62 C44 55, 22 42, 0 28"
              stroke="url(#fireGrad2)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
            {/* Core flame */}
            <path
              d="M147 71 C120 65, 92 56, 64 48 C42 40, 20 32, 0 18"
              stroke="url(#fireGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              opacity="0.95"
            />
            {/* Bright inner core */}
            <path
              d="M147 71 C122 63, 96 53, 70 44 C50 37, 28 30, 8 20"
              stroke="#FFEE44"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
            {/* Fire tip sparks */}
            {[
              { cx: 90, cy: 58, r: 5, c: '#FF8A20', o: 0.7 },
              { cx: 60, cy: 48, r: 4, c: '#FFEE44', o: 0.8 },
              { cx: 35, cy: 38, r: 3.5, c: '#FF8A20', o: 0.6 },
              { cx: 15, cy: 28, r: 3, c: '#FF5A3C', o: 0.5 },
              { cx: 5, cy: 22, r: 2, c: '#FFEE44', o: 0.7 },
              { cx: 75, cy: 65, r: 3, c: '#FF5A3C', o: 0.5 },
              { cx: 48, cy: 52, r: 2.5, c: '#FF8A20', o: 0.6 },
            ].map((s, i) => (
              <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.c} opacity={s.o} />
            ))}
          </g>

          {/* === CLAWS === */}
          <path d="M268 195 C268 208, 264 218, 262 225" stroke="#3A0D05" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M268 195 C268 208, 264 218, 262 225" stroke="#5A1208" strokeWidth="4" strokeLinecap="round" fill="none" />
          {[[-6, 6], [-2, 8], [3, 7], [7, 5]].map(([dx, dy], i) => (
            <path key={i} d={`M262 225 C${262 + dx} ${225 + dy}, ${262 + dx * 1.5} ${225 + dy * 2}, ${262 + dx * 2} ${225 + dy * 1.5}`}
              stroke="#4A0E04" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ))}
          {/* Back claw */}
          <path d="M300 188 C302 200, 300 210, 298 215" stroke="#3A0D05" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M300 188 C302 200, 300 210, 298 215" stroke="#5A1208" strokeWidth="3" strokeLinecap="round" fill="none" />
          {[[-4, 5], [0, 7], [4, 5]].map(([dx, dy], i) => (
            <path key={i} d={`M298 215 C${298 + dx} ${215 + dy}, ${298 + dx * 1.5} ${215 + dy * 1.8}, ${298 + dx * 2} ${215 + dy * 1.4}`}
              stroke="#4A0E04" strokeWidth="2" strokeLinecap="round" fill="none" />
          ))}
        </svg>
      </div>
    </div>
  )
}
