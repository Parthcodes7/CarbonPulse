import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

import colorMapUrl from '../../assets/textures/earth_atmos_2048.jpg';
import normalMapUrl from '../../assets/textures/earth_normal_2048.jpg';
import specularMapUrl from '../../assets/textures/earth_specular_2048.jpg';
import cloudsMapUrl from '../../assets/textures/earth_clouds_1024.png';

// ─── Floating CO₂ Molecule ───────────────────────────────────────────
const CO2Molecule = ({ position, speed }: { position: [number, number, number]; speed: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const startY = position[1];

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = startY + Math.sin(state.clock.elapsedTime * speed + position[0]) * 0.3;
    groupRef.current.rotation.z += 0.005 * speed;
    groupRef.current.rotation.x += 0.003 * speed;
  });

  return (
    <group ref={groupRef} position={position} scale={0.08}>
      {/* Center carbon atom */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Left oxygen */}
      <mesh position={[-1.2, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      {/* Right oxygen */}
      <mesh position={[1.2, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      {/* Bond lines */}
      <mesh position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
    </group>
  );
};

// ─── Floating Leaf ────────────────────────────────────────────────────
const FloatingLeaf = ({ position, speed, color }: { position: [number, number, number]; speed: number; color: string }) => {
  const ref = useRef<THREE.Mesh>(null);
  const startPos = [...position] as [number, number, number];

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed;
    ref.current.position.y = startPos[1] + Math.sin(t) * 0.5;
    ref.current.position.x = startPos[0] + Math.sin(t * 0.6) * 0.3;
    ref.current.rotation.x += 0.01;
    ref.current.rotation.y += 0.015;
    ref.current.rotation.z += 0.008;
  });

  return (
    <mesh ref={ref} position={position}>
      <tetrahedronGeometry args={[0.12, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.5} transparent opacity={0.85} />
    </mesh>
  );
};

// ─── Smoke Particle System ───────────────────────────────────────────
const SmokeParticle = ({ position }: { position: [number, number, number] }) => {
  const ref = useRef<THREE.Mesh>(null);
  const startY = position[1];

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = startY + ((state.clock.elapsedTime * 0.3 + position[0]) % 2.5);
    const scale = Math.sin((state.clock.elapsedTime * 0.3 + position[0]) / 2.5 * Math.PI) * 0.15;
    ref.current.scale.setScalar(Math.max(0.01, scale));
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#4b5563" transparent opacity={0.15} roughness={1} />
    </mesh>
  );
};

// ─── Animated Emission Ring ─────────────────────────────────────────
const EmissionRing = ({ radius, color, speed }: { radius: number; color: string; speed: number }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const scale = 1 + Math.sin(state.clock.elapsedTime * speed) * 0.03;
    ref.current.scale.setScalar(scale);
    ref.current.rotation.z += 0.002 * speed;
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 8, 120]} />
      <meshBasicMaterial color={color} transparent opacity={0.15} />
    </mesh>
  );
};

// ─── The Enhanced Earth ─────────────────────────────────────────────
const EarthMesh = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const [colorMap, normalMap, specularMap, cloudsMap] = useTexture([
    colorMapUrl,
    normalMapUrl,
    specularMapUrl,
    cloudsMapUrl,
  ]);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0004;
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0006;
  });

  return (
    <group position={[0, -0.5, 0]}>
      <group ref={groupRef}>
        <mesh ref={earthRef}>
          <sphereGeometry args={[2, 80, 80]} />
          <meshPhongMaterial
            map={colorMap}
            normalMap={normalMap}
            specularMap={specularMap}
            specular={new THREE.Color(0x334455)}
            shininess={20}
          />
        </mesh>
      </group>

      {/* Clouds */}
      <mesh ref={cloudsRef} scale={[1.012, 1.012, 1.012]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere */}
      <mesh scale={[1.1, 1.1, 1.1]}>
        <sphereGeometry args={[2, 48, 48]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer glow */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// ─── Star Field ─────────────────────────────────────────────────────
const CustomStars = () => {
  const count = 4000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 60 + Math.random() * 80;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.0001; });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#a5f3fc" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
};

// ─── Main Export ─────────────────────────────────────────────────────
export default function EarthGlobe() {
  // CO₂ Molecules floating around the atmosphere
  const molecules = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4 - 2,
      ] as [number, number, number],
      speed: 0.5 + Math.random() * 1.2,
    })), []);

  // Floating leaves (green hope)
  const leaves = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 3 - 1,
      ] as [number, number, number],
      speed: 0.3 + Math.random() * 0.8,
      color: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#065f46'][Math.floor(Math.random() * 5)],
    })), []);

  // Smoke particles (pollution)
  const smokeParticles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      position: [(Math.random() - 0.5) * 8, -3 + Math.random() * 2, (Math.random() - 0.5) * 4] as [number, number, number],
    })), []);

  return (
    <>
      <CustomStars />

      {/* Orbital emission rings around the earth */}
      <group position={[0, -0.5, 0]}>
        <EmissionRing radius={2.8} color="#ef4444" speed={1.2} />
        <EmissionRing radius={3.3} color="#f59e0b" speed={0.8} />
        <EmissionRing radius={3.9} color="#10b981" speed={0.5} />
      </group>

      <React.Suspense fallback={null}>
        <EarthMesh />
      </React.Suspense>

      {/* CO₂ molecules */}
      {molecules.map(m => (
        <CO2Molecule key={m.id} position={m.position} speed={m.speed} />
      ))}

      {/* Green leaves (hope) */}
      {leaves.map(l => (
        <FloatingLeaf key={l.id} position={l.position} speed={l.speed} color={l.color} />
      ))}

      {/* Smoke particles */}
      {smokeParticles.map(s => (
        <SmokeParticle key={s.id} position={s.position} />
      ))}
    </>
  );
}
