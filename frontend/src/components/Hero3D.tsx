'use client';

import { useMemo, useRef, useEffect, Suspense, Component, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float, ContactShadows, useTexture } from '@react-three/drei';
import * as THREE from 'three';

type CanvasErrorBoundaryProps = { children: ReactNode };
type CanvasErrorBoundaryState = { hasError: boolean };

const SHIRT_POSITION: [number, number, number] = [0, -0.72, 0];
const SHADOW_POSITION: [number, number, number] = [0, -1.65, 0];

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  constructor(props: CanvasErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <mesh position={SHIRT_POSITION}>
          <boxGeometry args={[0.85, 1.1, 0.35]} />
          <meshStandardMaterial color="#f3f4f6" />
        </mesh>
      );
    }
    return this.props.children;
  }
}

function Particles() {
  const ref = useRef<THREE.Points>(null);

  const { pos, col } = useMemo(() => {
    const count = 100;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (pseudoRandom(i * 3 + 1) - 0.5) * 15;
      pos[i * 3 + 1] = (pseudoRandom(i * 3 + 2) - 0.5) * 10;
      pos[i * 3 + 2] = (pseudoRandom(i * 3 + 3) - 0.5) * 10;

      const b = 0.7 + pseudoRandom(i * 5 + 11) * 0.3;
      col[i * 3] = b * 0.75;
      col[i * 3 + 1] = b * 0.55;
      col[i * 3 + 2] = b;
    }

    return { pos, col };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors sizeAttenuation transparent opacity={0.32} />
    </points>
  );
}

function TShirt() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/shirt_baked.glb');

  const [smileTextureSource, chestLogoTextureSource, chestLogoBumpSource] = useTexture([
    '/joker_smile_no_bg_2k.png',
    '/hero-chest-logo.png',
    '/hero-chest-logo-bump.png',
  ]);
  const smileTexture = useMemo(() => {
    const texture = smileTextureSource.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }, [smileTextureSource]);

  const chestLogoTexture = useMemo(() => {
    const texture = chestLogoTextureSource.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }, [chestLogoTextureSource]);

  const chestLogoBump = useMemo(() => {
    const texture = chestLogoBumpSource.clone();
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }, [chestLogoBumpSource]);

  const printRoughnessTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 280; i++) {
      const x = pseudoRandom(i * 7 + 1) * size;
      const y = pseudoRandom(i * 7 + 2) * size;
      const len = 6 + pseudoRandom(i * 7 + 3) * 22;
      const ang = pseudoRandom(i * 7 + 4) * Math.PI * 2;
      const x2 = x + Math.cos(ang) * len;
      const y2 = y + Math.sin(ang) * len;
      const alpha = 0.08 + pseudoRandom(i * 7 + 5) * 0.15;
      ctx.strokeStyle = `rgba(40, 40, 40, ${alpha})`;
      ctx.lineWidth = 0.7 + pseudoRandom(i * 7 + 6) * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3.5, 1.6);
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      smileTexture.dispose();
      chestLogoTexture.dispose();
      chestLogoBump.dispose();
    };
  }, [smileTexture, chestLogoTexture, chestLogoBump]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.rotation.y = Math.PI + Math.sin(t * 0.55) * 0.14;
      groupRef.current.position.y = -0.85 + Math.sin(t * 1.35) * 0.06;
    }
  });

  const shirtObject = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const baseMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const material = baseMaterial instanceof THREE.MeshStandardMaterial
        ? baseMaterial.clone()
        : new THREE.MeshStandardMaterial();

      material.color.set('#f3f3f5');
      material.roughness = 0.64;
      material.metalness = 0.03;
      material.side = THREE.DoubleSide;
      material.envMapIntensity = 0.8;

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.material = material;
    });

    // Normalize origin and size so the shirt stays visible regardless of source transforms.
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    clone.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fitScale = 1.9 / maxDim;
    clone.scale.setScalar(fitScale);

    return clone;
  }, [scene]);

  // Chest logo plane sized for the full wordmark so it stays readable.
  const chestPrintGeometry = useMemo(() => {
    const W = 0.64, H = W * (620 / 2200);
    const geometry = new THREE.PlaneGeometry(W, H, 120, 24);
    const pos = geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const curveAcross = -Math.pow(Math.abs(x) / (W / 2), 2) * 0.009;
      const curveDown   = -Math.pow(y / (H / 2), 2) * 0.0015;
      const chestSlope  = -y * 0.006;
      pos.setZ(i, curveAcross + curveDown + chestSlope);
    }

    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  const backPrintGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1.12, 0.33, 96, 24);
    const pos = geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const curveAcross = -Math.pow(Math.abs(x) / 0.56, 2) * 0.046;
      const curveDown = -Math.pow((y + 0.02) / 0.165, 2) * 0.007;
      pos.setZ(i, curveAcross + curveDown);
    }

    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  return (
    <group ref={groupRef} position={SHIRT_POSITION} scale={1.45} dispose={null}>
      <group>
        <primitive object={shirtObject} />

        {/* Front chest wordmark from the shared logo artwork */}
        <mesh
          geometry={chestPrintGeometry}
          position={[0, 0.325, 0.394]}
          rotation={[-0.028, 0, 0]}
          renderOrder={9}
          frustumCulled={false}
        >
          <meshStandardMaterial
            map={chestLogoTexture}
            transparent
            alphaTest={0.02}
            opacity={0.95}
            bumpMap={chestLogoBump}
            bumpScale={0.05}
            roughnessMap={printRoughnessTexture ?? undefined}
            roughness={0.88}
            metalness={0}
            emissive="#53008a"
            emissiveIntensity={0.02}
            side={THREE.FrontSide}
            depthWrite
            polygonOffset
            polygonOffsetFactor={-2}
            toneMapped
          />
        </mesh>

        {/* Joker smile print on shirt back */}
        <mesh
          geometry={backPrintGeometry}
          position={[0, 0.225, -0.432]}
          rotation={[0, Math.PI, 0]}
          renderOrder={9}
          frustumCulled={false}
        >
          <meshPhysicalMaterial
            map={smileTexture}
            roughnessMap={printRoughnessTexture ?? undefined}
            transparent
            alphaTest={0.08}
            opacity={0.94}
            roughness={0.56}
            metalness={0.02}
            clearcoat={0.24}
            clearcoatRoughness={0.62}
            side={THREE.DoubleSide}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-6}
            emissive="#2b0007"
            emissiveIntensity={0.03}
            toneMapped
          />
        </mesh>
      </group>
    </group>
  );
}

export default function Hero3D() {
  return (
    <div
      className="w-full h-[600px] md:h-screen absolute top-0 left-0 pointer-events-none"
      style={{
        zIndex: 0,
        background: 'var(--brand-bg-main)',
      }}
    >
      <Canvas
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 5], fov: 40 }}
      >
        <ambientLight intensity={0.52} />
        <directionalLight position={[3.5, 5.2, 6]} intensity={1.22} castShadow />
        <directionalLight position={[-4, 2.8, 3]} intensity={0.5} color="#f2d9ff" />
        <pointLight position={[0, 4.5, -4]} intensity={0.84} color="#ffe9ff" />
        <hemisphereLight args={['#fff6ff', '#3c0b63', 0.48]} />

        <Particles />

        <CanvasErrorBoundary>
          <Suspense
            fallback={
              <mesh position={SHIRT_POSITION}>
                <boxGeometry args={[0.85, 1.1, 0.35]} />
                <meshStandardMaterial color="#f3f4f6" />
              </mesh>
            }
          >
            <Float speed={2.0} rotationIntensity={0.34} floatIntensity={0.42}>
              <TShirt />
            </Float>
          </Suspense>
        </CanvasErrorBoundary>

        <ContactShadows position={SHADOW_POSITION} opacity={0.34} scale={6} blur={2.2} far={4} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/shirt_baked.glb');
