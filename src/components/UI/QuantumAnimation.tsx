import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Float, Environment } from "@react-three/drei";
import * as THREE from "three";

// --- 1. THE CORE MODEL LOGIC ---
// Fixed to rotate horizontally on the Y-axis (no more "vertical" flipping)
function Model() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Logic: Primary horizontal rotation (Y) with a fixed slight tilt (X)
      groupRef.current.rotation.y += delta * 0.3; 
      groupRef.current.rotation.x = 0.2; // Fixed tilt for sophistication
    }
  });

  return (
    <group ref={groupRef}>
      {/* The Solid Glass Core */}
      <mesh>
        <icosahedronGeometry args={[2.5, 0]} />
        <meshPhysicalMaterial 
          color="#C8B6FF" // Lavender base
          transmission={1}
          roughness={0.1}
          thickness={2}
          iridescence={1}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* The Digital Lattice (Wireframe) */}
      <mesh>
        <icosahedronGeometry args={[2.51, 0]} />
        <meshBasicMaterial color="#A6D8FF" wireframe transparent opacity={0.4} />
      </mesh>

      {/* Glowing Nodes at vertices (exactly like the video) */}
      {[...Array(12)].map((_, i) => {
        const phi = Math.acos(-1 + (2 * i) / 12);
        const theta = Math.sqrt(12 * Math.PI) * phi;
        return (
          <mesh key={i} position={[
            2.5 * Math.sin(phi) * Math.cos(theta),
            2.5 * Math.sin(phi) * Math.sin(theta),
            2.5 * Math.cos(phi)
          ]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#F2C6FF" />
            <pointLight intensity={2} distance={1} color="#F2C6FF" />
          </mesh>
        );
      })}
    </group>
  );
}

// --- 2. THE PARTICLE LOGIC ---
// Fixed to orbit the model in tight, structured paths (Horizontal & Oblique)
function OrbitingDataParticles() {
  const points = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (points.current) {
      // Logic: Rotate the whole swarm group horizontally
      points.current.rotation.y += delta * 0.5;
    }
  });

  // Create particles in specific orbital bands (not scattered)
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 80; i++) {
      const radius = 3.5 + Math.random() * 1.5;
      const angle = (i / 80) * Math.PI * 2;
      // We force Y to be small to keep particles near the equator (horizontal flow)
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 3; 
      
      const color = i % 3 === 0 ? "#A6D8FF" : i % 3 === 1 ? "#C8B6FF" : "#F2C6FF";
      temp.push({ x, y, z, color });
    }
    return temp;
  }, []);

  return (
    <group ref={points}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// --- 3. THE HERO SCENE ---
export default function HeroScene() {
  return (
    <div className="w-full h-[600px] lg:h-[800px] relative pointer-events-none">
      <Canvas gl={{ antialias: true, alpha: true }}>
        <React.Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          
          {/* Cyan/Pink Studio Lighting to match the original video tones */}
          <pointLight position={[-10, 5, 5]} intensity={15} color="#A6D8FF" />
          <pointLight position={[10, -5, 5]} intensity={15} color="#F2C6FF" />
          <ambientLight intensity={0.4} />
          
          <Environment preset="city" />

          {/* Core Animation Group */}
          <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
            <Model />
            <OrbitingDataParticles />
          </Float>

        </React.Suspense>
      </Canvas>
    </div>
  );
}
