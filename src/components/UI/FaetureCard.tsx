import { motion } from "framer-motion";

interface FeatureProps {
  id: string; // The unique ID for the physical card
  title: string;
  desc: string;
  imgSrc: string;
  linkText: string;
}

const FeatureCard = ({ id, title, desc, imgSrc, linkText }: FeatureProps) => {
  return (
    <motion.div 
      layout // Enables the physical sliding motion
      layoutId={id} // Unique ID for the physical "instance"
      transition={{
        layout: { type: "spring", stiffness: 80, damping: 20, mass: 1 },
        opacity: { duration: 0.2 }
      }}
      className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-[0_15px_50px_rgba(0,0,0,0.03)] border border-white group h-full w-full"
    >
      <div className="w-52 h-52 mb-6 flex items-center justify-center">
        <motion.img 
          layout="position" // Ensures the image doesn't stretch during move
          src={imgSrc} 
          alt={title} 
          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" 
        />
      </div>
      <motion.h3 layout="position" className="text-[22px] font-bold text-gray-900 mb-3 tracking-tight">
        {title}
      </motion.h3>
      <motion.p layout="position" className="text-gray-500 text-[14px] leading-relaxed mb-8 max-w-[280px]">
        {desc}
      </motion.p>
      <motion.button layout="position" className="text-[#3b82f6] text-[13px] font-bold hover:underline mt-auto uppercase tracking-wide">
        {linkText}
      </motion.button>
    </motion.div>
  );
};

export default FeatureCard;

