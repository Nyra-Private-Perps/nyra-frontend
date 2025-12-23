import { useEffect, useRef } from "react"

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function AnimatedGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    
    resize()
    window.addEventListener("resize", resize)

    const animate = () => {
      const width = canvas.width
      const height = canvas.height
      const imageData = ctx.createImageData(width, height)
      const data = imageData.data

      time += 0.05

      for (let y = 0; y < height; y += 4) { 
        for (let x = 0; x < width; x += 4) {
          let uvX = (6.0 * x) / width
          let uvY = (6.0 * y) / height

          for (let n = 1; n < 8; n++) { 
            const i = n
            uvX += (1.0 / i) * Math.sin(i * uvY + time * i) + 0.8
            uvY += (1.0 / i) * Math.sin(uvX + time * i) + 1.6
          }

          const gradientValue = Math.cos(uvX + uvY) * 0.5 + 0.5
          let r, g, b

          if (gradientValue < 0.5) {
             const t = gradientValue * 2
             r = lerp(0.05, 0.1, t); g = lerp(0.08, 0.2, t); b = lerp(0.15, 0.65, t);
          } else {
             const t = (gradientValue - 0.5) * 2
             r = lerp(0.1, 0.98, t); g = lerp(0.2, 0.56, t); b = lerp(0.65, 0.28, t);
          }

          for (let dy = 0; dy < 4; dy++) {
            for (let dx = 0; dx < 4; dx++) {
              if (x + dx < width && y + dy < height) {
                const idx = ((y + dy) * width + (x + dx)) * 4
                data[idx] = r * 255
                data[idx + 1] = g * 255
                data[idx + 2] = b * 255
                data[idx + 3] = 255
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mix-blend-screen opacity-30 pointer-events-none" />
}
