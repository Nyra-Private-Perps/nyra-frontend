function GhostCard({ height = "h-40", hasPattern = false }: { height?: string, hasPattern?: boolean }) {
    return (
      <div className={`w-full ${height} bg-gradient-to-b from-white/40 to-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-sm relative overflow-hidden`}>
         {hasPattern && (
           <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
         )}
      </div>
    )
  }

  export default GhostCard;