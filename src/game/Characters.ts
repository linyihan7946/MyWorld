import { Entity } from './Entity';
import * as THREE from 'three';

export class Steve extends Entity {
  constructor() {
    super(10, 0.5);
    // Body
    const bodyGeo = new THREE.BoxGeometry(0.6, 1.8, 0.2);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x0000FF });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    this.mesh.add(body);
    
    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xFFA07A });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.0;
    this.mesh.add(head);
  }
}

export class Alex extends Entity {
  constructor() {
    super(10, 0.5);
    const bodyGeo = new THREE.BoxGeometry(0.5, 1.7, 0.2);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    this.mesh.add(body);

    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xFFA07A });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.95;
    this.mesh.add(head);
  }
}

export class Villager extends Entity {
  constructor() {
    super(10, 0);
    const bodyGeo = new THREE.BoxGeometry(0.6, 1.8, 0.4);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    this.mesh.add(body);

    const headGeo = new THREE.BoxGeometry(0.4, 0.6, 0.4);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xFFA07A });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.1;
    this.mesh.add(head);
  }
}

export class IronGolem extends Entity {
  constructor() {
    super(100, 10.75);
    const bodyGeo = new THREE.BoxGeometry(1.4, 1.5, 0.8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.5;
    this.mesh.add(body);

    const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.6;
    this.mesh.add(head);
    
    // Arms
    const armGeo = new THREE.BoxGeometry(0.4, 2.0, 0.4);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-1, 1.5, 0);
    this.mesh.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(1, 1.5, 0);
    this.mesh.add(rightArm);
  }
}
