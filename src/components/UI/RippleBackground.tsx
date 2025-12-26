const RippleBackground = () => {
    return (
      <video
        autoPlay
        muted
        loop
        playsInline
        className="ripple-video"
      >
        <source src="/ripple.mp4" type="video/mp4" />
      </video>
    );
  };
  
  export default RippleBackground;
