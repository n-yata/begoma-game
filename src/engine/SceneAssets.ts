import * as THREE from 'three';
import { TOKO_RADIUS } from '../game/komaSpecs';
import { KOMA_HALF_HEIGHT, KOMA_RADIUS, TOKO_DEPTH, tokoHeightAt } from './PhysicsWorld';

/** 椀の内面色（縁）。底は DEPTH_DARKEN 分だけ暗くする */
const BOWL_RIM_COLOR = new THREE.Color(0x9a7a52);
/** 底の暗さ（0〜1。深いほど暗くして窪みを見せる） */
const DEPTH_DARKEN = 0.55;
/** 等高線リングの半径（曲面の可視化） */
const CONTOUR_RADII = [0.35, 0.7, 1.05, 1.35];

/** 椀状トコのメッシュを生成する。高さ関数は物理（tokoHeightAt）と共有 */
export function createTokoMesh(): THREE.Group {
  const group = new THREE.Group();

  // 椀の内面: 半径方向のプロファイルを LatheGeometry で回転させ、
  // 深さに応じた頂点カラー（底ほど暗い）で窪みを視覚化する
  const segments = 48;
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= segments; i++) {
    const r = (i / segments) * TOKO_RADIUS;
    points.push(new THREE.Vector2(r, tokoHeightAt(r)));
  }
  const bowlGeometry = new THREE.LatheGeometry(points, 64);
  const positions = bowlGeometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const depthRatio = Math.min(1, Math.max(0, -positions.getY(i) / TOKO_DEPTH));
    color.copy(BOWL_RIM_COLOR).multiplyScalar(1 - DEPTH_DARKEN * depthRatio);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  bowlGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const bowl = new THREE.Mesh(
    bowlGeometry,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      side: THREE.DoubleSide,
    }),
  );
  bowl.receiveShadow = true;
  group.add(bowl);

  // 等高線リング: 曲面であることを読み取れるように薄い線を同心円状に置く
  const contourMaterial = new THREE.MeshBasicMaterial({
    color: 0x4a3a26,
    transparent: true,
    opacity: 0.45,
  });
  for (const r of CONTOUR_RADII) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 64), contourMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = tokoHeightAt(r) + 0.004;
    group.add(ring);
  }

  // 縁のリング（樽の縁）
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(TOKO_RADIUS, 0.06, 12, 64),
    new THREE.MeshStandardMaterial({ color: 0x5b4630, roughness: 0.9 }),
  );
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  // 樽の胴体（見た目のみ）
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(TOKO_RADIUS, TOKO_RADIUS * 0.92, 0.8, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x6e5638, roughness: 0.95, side: THREE.DoubleSide }),
  );
  barrel.position.y = -0.4 - TOKO_DEPTH;
  group.add(barrel);

  return group;
}

/** コマのメッシュ（円錐台の胴 + 軸）。color でプレイヤー/CPU を塗り分ける */
export function createKomaMesh(color: number): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(KOMA_RADIUS, KOMA_RADIUS * 0.25, KOMA_HALF_HEIGHT * 2, 24),
    new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.35 }),
  );
  body.castShadow = true;
  group.add(body);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(KOMA_RADIUS * 0.35, KOMA_RADIUS * 0.6, KOMA_HALF_HEIGHT, 24),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.3 }),
  );
  cap.position.y = KOMA_HALF_HEIGHT * 1.4;
  group.add(cap);

  // 回転が視認できるよう、上面に非対称のマーカーを置く
  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(KOMA_RADIUS * 0.9, 0.006, 0.012),
    new THREE.MeshStandardMaterial({ color: 0xffffff }),
  );
  marker.position.set(KOMA_RADIUS * 0.45, KOMA_HALF_HEIGHT * 1.05, 0);
  group.add(marker);

  return group;
}
