import * as THREE from 'three';
import type { Vec3 } from '../types/geometry';
import { WebGLUnsupportedError } from './errors';
import { createKomaMesh, createTokoMesh } from './SceneAssets';
import type { KomaSide } from './PhysicsWorld';

const PLAYER_COLOR = 0x2b6bff;
const CPU_COLOR = 0xff4d4d;

/**
 * Three.js シーンのラッパ。固定俯瞰カメラでトコ全体を映す。
 * コマの回転はゲームロジックの spin 値を見た目に反映する（物理では回していない）。
 */
export class Renderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private komaMeshes = new Map<KomaSide, THREE.Group>();
  private komaAngles = new Map<KomaSide, number>();
  private throwArrow: THREE.ArrowHelper | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    if (!gl) throw new WebGLUnsupportedError();

    this.renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene.background = new THREE.Color(0x1a1a2e);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    // 低めの角度で椀の窪み（断面）が見える構図にする
    this.camera.position.set(0, 2.0, 3.2);
    this.camera.lookAt(0, -0.3, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(2, 5, 3);
    this.scene.add(ambient, dir, createTokoMesh());

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // 縦持ちでもトコ全体が入るよう、縦長時は引きにする。角度は低めを保ち窪みを見せる
    this.camera.position.z = w < h ? 4.0 : 3.2;
    this.camera.position.y = w < h ? 2.5 : 2.0;
    this.camera.lookAt(0, -0.3, 0);
    this.camera.updateProjectionMatrix();
  }

  /** コマのメッシュを配置する（既存があれば置き換え） */
  spawnKoma(side: KomaSide, position: Vec3): void {
    this.removeKoma(side);
    const mesh = createKomaMesh(side === 'player' ? PLAYER_COLOR : CPU_COLOR);
    mesh.position.set(position.x, position.y, position.z);
    this.scene.add(mesh);
    this.komaMeshes.set(side, mesh);
    this.komaAngles.set(side, 0);
  }

  private removeKoma(side: KomaSide): void {
    const mesh = this.komaMeshes.get(side);
    if (mesh) {
      this.scene.remove(mesh);
      this.komaMeshes.delete(side);
    }
  }

  /** 両コマを取り除く（再戦時のリセット） */
  resetKoma(): void {
    this.removeKoma('player');
    this.removeKoma('cpu');
  }

  /** 物理位置とゲームロジックの回転速度を見た目へ反映する */
  syncKoma(side: KomaSide, position: Vec3, spin: number, dt: number): void {
    const mesh = this.komaMeshes.get(side);
    if (!mesh) return;
    mesh.position.set(position.x, position.y, position.z);
    const angle = (this.komaAngles.get(side) ?? 0) + spin * dt;
    this.komaAngles.set(side, angle);
    mesh.rotation.y = angle;
    // 回転が弱まるほどふらつく（傾き演出）
    const wobble = Math.max(0, 1 - spin / 60);
    mesh.rotation.x = Math.sin(angle * 0.35) * wobble * 0.35;
    mesh.rotation.z = Math.cos(angle * 0.29) * wobble * 0.35;
  }

  /**
   * 投擲ガイドの床面矢印を更新する（cross-cutting.md「HUD」の仕様）。
   * origin を起点に水平方向 (dirX, dirZ) へ、パワーに応じた長さで表示する
   */
  updateThrowGuide(origin: Vec3, dirX: number, dirZ: number, power: number): void {
    const len = Math.hypot(dirX, dirZ);
    if (len < 1e-6) {
      this.hideThrowGuide();
      return;
    }
    const dir = new THREE.Vector3(dirX / len, 0, dirZ / len);
    const length = 0.5 + power * 0.9;
    if (!this.throwArrow) {
      this.throwArrow = new THREE.ArrowHelper(dir, new THREE.Vector3(), length, PLAYER_COLOR);
      this.scene.add(this.throwArrow);
    }
    this.throwArrow.position.set(origin.x, origin.y, origin.z);
    this.throwArrow.setDirection(dir);
    this.throwArrow.setLength(length, 0.18, 0.12);
    this.throwArrow.visible = true;
  }

  hideThrowGuide(): void {
    if (this.throwArrow) this.throwArrow.visible = false;
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
