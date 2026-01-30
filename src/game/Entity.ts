import * as THREE from 'three';

export class Entity {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public hp: number;
  public maxHp: number;
  public attack: number;

  constructor(hp: number, attack: number) {
    this.hp = hp;
    this.maxHp = hp;
    this.attack = attack;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.mesh = new THREE.Group();
  }

  public update(dt: number) {
    // Basic physics update placeholder
    this.position.add(this.velocity.clone().multiplyScalar(dt));
    this.mesh.position.copy(this.position);
  }
}
