import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float } from "@react-three/drei";

function NeuralIcosahedron() {
  const meshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);

  // Generate the icosahedron geometry once
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2.5, 0), []);
  
  // Extract vertex positions to place glowing dots at the corners (just like the video)
  const vertices = useMemo(() => {
    const pos = geometry.attributes.position;
    const points = [];
    for (let i = 0; i < pos.count; i++) {
      points.push(new THREE.Vector3().fromBufferAttribute(pos, i));
    }
    return points;
  }, [geometry]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current && lineRef.current) {
      // Rotation speed matching the video
      meshRef.current.rotation.y = t * 0.2;
      meshRef.current.rotation.x = t * 0.1;
      lineRef.current.rotation.copy(meshRef.current.rotation);
    }
  });

  return (
    <group>
      {/* 1. The Semi-Transparent Inner Volume */}
      <mesh ref={meshRef}>
        <primitive object={geometry} />
        <meshPhongMaterial 
          color="#C8B6FF" 
          transparent 
          opacity={0.15} 
          shininess={100}
          emissive="#C8B6FF"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 2. The Glowing Wireframe Lines */}
      <lineSegments ref={lineRef}>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#A6D8FF" transparent opacity={0.4} />
      </lineSegments>

      {/* 3. The Glowing Nodes (Dots at the corners) */}
      <group>
        {vertices.map((v, i) => (
          <mesh key={i} position={v} onUpdate={(self) => self.lookAt(0,0,0)}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#F2C6FF" />
            <pointLight intensity={2} distance={1} color="#F2C6FF" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default NeuralIcosahedron;