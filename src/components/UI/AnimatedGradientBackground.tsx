const OutstandingBackground = () => (
    <>
      {/* 1. Fixed Radial Gradient Base */}
      <div 
        className="fixed inset-0 -z-20"
        style={{
          backgroundColor: '#F8F7FF',
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.1) 0px, transparent 50%)
          `,
          backgroundAttachment: 'fixed'
        }}
      />
      {/* 2. Floating Animated Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply animate-float"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 blur-[120px] mix-blend-multiply animate-float" style={{ animationDelay: "-3s" }}></div>
      </div>
    </>
  );

export default OutstandingBackground;