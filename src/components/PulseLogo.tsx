export default function PulseLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 22, md: 28, lg: 36 }[size]
  const textSize = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }[size]

  return (
    <div className="flex items-center gap-2.5">
      <svg width={dims} height={dims} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#FF5A3C" />
        <path
          d="M5 17h4l2.5-7 4 14 3-10 2 3h6.5"
          stroke="#0B0D12"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className={`font-display font-semibold ${textSize} tracking-tight text-paper`}>
        Nascraft <span className="text-ember">Pulse</span>
      </span>
    </div>
  )
}
