import { motion } from "framer-motion";
import RippleBackground from "./../UI/RippleBackground";

const Hero = () => {
  return (
    <section className="hero">
      <RippleBackground />

      <motion.div
        className="hero-content"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <span className="badge">V2 PROTOCOL LIVE</span>

        <h1>
          Sophisticated <span>Strategies.</span>
          <br />
          Zero Footprint.
        </h1>

        <p>
          Access institutional-grade perpetual strategies while
          severing the on-chain link between you and your trades.
        </p>

        <div className="hero-actions">
          <button className="btn-primary">Launch App ↗</button>
          <button className="btn-play">▶</button>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
