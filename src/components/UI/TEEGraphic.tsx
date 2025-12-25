import { motion } from "framer-motion"
const TeeGraphic = () => {
    return(
    <div className="relative w-full h-[600px] flex items-center justify-center">
      <motion.div
        className="relative z-10 w-[200px] lg:w-[250px]"
        style={{ transformStyle: "preserve-3d", rotateX: 50, rotateZ: 45 }}
        animate={{ x: [0, -10, 0], y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 312.03 953.99" className="w-full h-auto overflow-visible drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#1e3a8a" />
               <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
          <g id="Layer_2" data-name="Layer 2">
            <g id="Layer_1-2" data-name="Layer 1">
              <g><g><g><g>
                 <path fill="white" d="M172.73,386.07H94.06c-10.8,0-14.19,4.63-17.9,13.37-5,12.13-19.12,51.32-23.34,63.45a27.69,27.69,0,0,0-1.54,8.64,33.72,33.72,0,0,0,1.54,8.53c3.5,12.14,18.41,51.42,23.34,63.56,3.6,8.64,7.1,13.37,17.9,13.37h78.67c37.54,0,51.32-20.16,84.22-78.57a15.8,15.8,0,0,0,2.06-6.89,15.38,15.38,0,0,0-2.06-6.89c-32.8-58.52-46.68-78.57-84.22-78.57ZM97.25,540.64c-3.5,0-4.84-.62-6-3.5-6.17-15.63-16.35-46-22.52-61.5a10,10,0,0,1-.93-4.11,12,12,0,0,1,.93-4.11c6.17-15.53,17.07-45.67,22.52-61.61,1-2.77,2.47-3.39,6-3.39h71.67c31.78,0,40.11,15.22,69,62.73,1.85,3,2.47,4.73,2.47,6.38s-.62,3.29-2.47,6.37c-28.8,47.52-37.23,62.74-69,62.74Z" />
                 <path fill="white" d="M190.73,434.3H149.8c-7.2,0-10.8,3-11.21,9.05H126.45c-18.92,0-31.57,11.31-31.57,28.08s12.65,28.07,31.57,28.07h12.14c.41,6.07,4,9.15,11.21,9.15h40.93c7.71,0,11.31-3.49,11.31-10.59V444.79c0-7.1-3.6-10.49-11.31-10.49Zm-65.41,54.51c-12.13,0-20-7-20-17.38s7.92-17.38,20-17.38h13.16v34.76Z" />
              </g><g>
                 <path fill="white" d="M16.8,416.15V360.8a28.08,28.08,0,0,1,28-28.05h55v-16.5h-55A44.59,44.59,0,0,0,.3,360.8v55.35Z" />
                 <path fill="white" d="M99.85,611.13h-55a28.08,28.08,0,0,1-28-28V527.73H.3v55.35a44.59,44.59,0,0,0,44.54,44.55h55Z" />
                 <path fill="white" d="M295.18,527.73v55.35a28.08,28.08,0,0,1-28.05,28h-55.7v16.5h55.7a44.6,44.6,0,0,0,44.55-44.55V527.73Z" />
                 <path fill="white" d="M211.43,332.75h55.7a28.08,28.08,0,0,1-28.05,28.05v55.35h16.5V360.8a44.6,44.6,0,0,0-44.55-44.55h-55.7Z" />
              </g></g></g><rect x="0.55" y="316.43" width="310.93" height="310.93" rx="49.91" style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "1px" }} /></g>
              <g id="bottomFlows">
                 <path id="bottomPath1" d="M16.31,943.91v-49.5c0-30.82,6.58-60.65,18.57-84.24L59,762.77c12-23.58,18.56-53.42,18.56-84.24V628" style={{ fill: "none", opacity: 0.5, stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
                 <text fontFamily="monospace" fontSize="10" fill="#FFF" opacity="1"><textPath href="#bottomPath1">1011001<animate attributeName="startOffset" from="0%" to="100%" dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;0.7;0.7" dur="3s" repeatCount="indefinite" /></textPath></text>
                 <path id="bottomPath2" d="M106.28,943.91V870.18a208.84,208.84,0,0,1,4.94-45.51l17.12-76.4a209.3,209.3,0,0,0,4.93-45.5V628" style={{ fill: "none", opacity: 0.5, stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
                 <text fontFamily="monospace" fontSize="10" fill="#FFF" opacity="1"><textPath href="#bottomPath2">1001011<animate attributeName="startOffset" from="0%" to="100%" dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;0.7;0.7" dur="3s" repeatCount="indefinite" /></textPath></text>
                 <path id="bottomPath3" d="M183.42,628v73.73a209.3,209.3,0,0,0,4.93,45.5l17.12,76.4a208.84,208.84,0,0,1,4.94,45.51v74.81" style={{ fill: "none", opacity: 0.5, stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
                 <text fontFamily="monospace" fontSize="10" fill="#FFF" opacity="1"><textPath href="#bottomPath3">1110010<animate attributeName="startOffset" from="100%" to="0%" dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;0.7;0.7" dur="3s" repeatCount="indefinite" /></textPath></text>
                 <path id="bottomPath4" d="M232.42,628v49.49c0,30.82,6.57,60.65,18.56,84.24l24.1,47.4c12,23.59,18.56,53.42,18.56,84.24v50.58" style={{ fill: "none", opacity: 0.5, stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
                 <text fontFamily="monospace" fontSize="10" fill="#FFF" opacity="1"><textPath href="#bottomPath4">1010111<animate attributeName="startOffset" from="100%" to="0%" dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;0.7;0.7" dur="3s" repeatCount="indefinite" /></textPath></text>
                 <circle cx="16.31" cy="943.91" r="10.08" fill="white" />
                 <circle cx="105.96" cy="943.91" r="10.08" fill="white" />
                 <circle cx="210.43" cy="943.91" r="10.08" fill="white" />
                 <circle cx="294.05" cy="943.91" r="10.08" fill="white" />
              </g>
              <g id="topFlows">
                 <path d="M 235.26,316 v-50.52 c0,-30.82 6.56,-60.65 18.56,-84.24 l24.1,-47.4 c12,-23.59 18.56,-53.42 18.56,-84.24 V0" style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
                 <circle r="4" fill="#FFF" opacity="0.6"><animateMotion dur="4s" repeatCount="indefinite" begin="1.5s" path="M 235.26,316 v-50.52 c0,-30.82 6.56,-60.65 18.56,-84.24 l24.1,-47.4 c12,-23.59 18.56,-53.42 18.56,-84.24 V0" /><animate attributeName="opacity" values="0.6;0.6;0" begin="1.5s" dur="4s" repeatCount="indefinite" /></circle>
                 <path d="M 186.52,316 v-74.77 a209.32,209.32,0,0,1,4.93,-45.51 l17.13,-76.4 a209.46,209.46,0,0,0,4.93,-45.51 V0" style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
                 <circle r="4" fill="#FFF" opacity="0.6"><animateMotion dur="4s" repeatCount="indefinite" path="M 186.52,316 v-74.77 a209.32,209.32,0,0,1,4.93,-45.51 l17.13,-76.4 a209.46,209.46,0,0,0,4.93,-45.51 V0" /><animate attributeName="opacity" values="0.6;0.6;0" dur="4s" repeatCount="indefinite" /></circle>
                 <path d="M129.38,316V242.23a208.71,208.71,0,0,0-4.94-45.51l-17.12-76.4a209.46,209.46,0,0,1-4.94-45.51V0" style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
                 <circle r="4" fill="#FFF" opacity="0.6"><animateMotion dur="4s" begin="1.5s" repeatCount="indefinite" path="M129.38,316V242.23a208.71,208.71,0,0,0-4.94-45.51l-17.12-76.4a209.46,209.46,0,0,1-4.94-45.51V0" /><animate attributeName="opacity" values="0.6;0.6;0" begin="1.5s" dur="4s" repeatCount="indefinite" /></circle>
                 <path d="M80.37,316v-49.5c0-30.82-6.57-60.65-18.56-84.24l-24.09-47.4c-12-23.59-18.56-53.42-18.56-84.24V0" style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
                 <circle r="4" fill="#FFF" opacity="0.6"><animateMotion dur="4s" repeatCount="indefinite" path="M80.37,316v-49.5c0-30.82-6.57-60.65-18.56-84.24l-24.09-47.4c-12-23.59-18.56-53.42-18.56-84.24V0" /><animate attributeName="opacity" values="0.6;0.6;0" dur="4s" repeatCount="indefinite" /></circle>
              </g>
           </g></g>
        </svg>
      </motion.div>
      <img 
        src="/composed__denoised_edited.png"
        alt=""
        className="absolute pointer-events-none opacity-80"
        style={{
          zIndex: 0, 
          top: "43%",
          left: "65%",
          width: "100%", 
          height: "auto",
          transform: "translate(-65%, -20%) scale(1.5)" 
        }}
      />
    </div>
  )
}

export default TeeGraphic