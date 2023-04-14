import { Vector3, Quaternion, Object3D, Vector2, Plane, Raycaster, CylinderGeometry, MeshStandardMaterial, Mesh, TorusGeometry, Group } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// events
const pointerUp = "pointerup";
const pointerDown = "pointerdown";
const pointerMove = "pointermove";
// virtual
const onPointer = "onpointer";

const selectCHex = 0xaaaa00;
const defaultCHex = 0x0055aa;

// cartesian basis
const ex = new Vector3(1, 0, 0);
const ey = new Vector3(0, 1, 0);
const ez = new Vector3(0, 0, 1);

const aRad = 0.025;
const aHei = 0.05;
const aSeg = 20;
const getArrow = (radius, axis, angle, plane) => {
  const arrow = new CylinderGeometry(0.0, aRad, aHei, aSeg);
  arrow.translate(0, aHei * 1.5, 0);
  const base = new CylinderGeometry(aRad / 5, aRad / 5, aHei, aSeg);
  base.translate(0, aHei / 2, 0);
  const geometry = mergeGeometries([base, arrow]);
  geometry.translate(0, radius || 0, 0);

  const material = new MeshStandardMaterial({
    color: defaultCHex,
    wireframe: false,
    clippingPlanes: [plane],
    depthWrite: false,
    depthTest: false,
    transparent: true
  });

  const mesh = new Mesh(geometry, material);
  const q = new Quaternion();
  q.setFromAxisAngle(axis, angle);
  mesh.applyQuaternion(q);
  mesh.name = "arrow";
  return mesh;
};

const lSeg = 64;
const rSeg = 10;
const radius2 = aRad / 5;
const getTorus = (radius, axis, angle, plane) => {
  const geometry = new TorusGeometry(radius, radius2, rSeg, lSeg, Math.PI * 2);
  const material = new MeshStandardMaterial({
    color: defaultCHex,
    wireframe: false,
    clippingPlanes: [plane],
    depthWrite: false,
    depthTest: false,
    transparent: true
  });

  const mesh = new Mesh(geometry, material);
  const q = new Quaternion();
  q.setFromAxisAngle(axis, angle);
  mesh.applyQuaternion(q);
  mesh.name = "torus";
  return mesh;
};

class HelperGroup extends Group {
  constructor(radius) {
    super();
    this.radius = radius;
    this.pA = new Vector3();
    this.pB = new Vector3();

    this.dir = new Vector3();// tangential vector
    this.radial = new Vector3();
    this.normal = new Vector3();
    this.q = new Quaternion();
  }

  select() {
    if (this.selected) return;
    this.colorArr = [];
    this.children.forEach(_ => {
      this.colorArr.push(_.material.color.getHex());
      _.material.color.setHex(selectCHex);
    });
    this.selected = true;
  }

  unselect() {
    if (!this.selected) return;
    this.children.forEach((_, index) => {
      _.material.color.setHex(this.colorArr[index]);
    });
    this.selected = false;
  }
}

class TorusGroup extends HelperGroup {
  constructor(radius, plane) {
    super(radius);
    this.speed = 10.0;
    this.add(getTorus(radius, new Vector3(0, 0, 1), Math.PI / 2, plane));
    this.name = "torusGroup";
  }

  move(pointerA, pointerB, camera, ipoint) {

    this.pA.copy(pointerA);
    this.pB.copy(pointerB);

    this.pA.unproject(camera);
    this.pB.unproject(camera);
    const q = new Quaternion();
    const p = new Vector3();
    this.matrixWorld.decompose(p, q, { x: 1, y: 1, z: 1 });

    this.normal.copy(ez).applyQuaternion(q);
    this.radial.copy(ipoint).sub(p).projectOnPlane(this.normal).normalize().multiplyScalar(this.radius);
    this.dir.copy(this.normal).cross(this.radial);

    this.pB.sub(this.pA);
    const d = this.pB.multiplyScalar(this.speed).length() * Math.sign(this.pB.dot(this.dir));

    this.q.setFromAxisAngle(this.normal, d);
    this.parent.parent.applyQuaternion(this.q);

  }
}

class ArrowGroup extends HelperGroup {
  constructor(radius, plane) {
    super(radius);
    this.speed = 1;
    this.add(getArrow(radius, new Vector3(0, 0, 1), Math.PI / 2, plane));
    this.add(getArrow(radius, new Vector3(0, 0, 1), -Math.PI / 2, plane));
    this.name = "arrowGroup";
  }

  move(pointerA, pointerB, camera) {
    this.pA.copy(pointerA);
    this.pB.copy(pointerB);
    this.pA.unproject(camera);
    this.pB.unproject(camera);
    this.pB.sub(this.pA);

    this.q = new Quaternion();
    this.p = new Vector3();
    this.matrixWorld.decompose(this.p, this.q, { x: 1, y: 1, z: 1 });

    this.dir.copy(ex).applyQuaternion(this.q);
    const d = this.pB.multiplyScalar(this.speed).length() * Math.sign(this.pB.dot(this.dir));
    this.dir.multiplyScalar(d);
    this.parent.parent.position.add(this.dir);
  }
}

class ControlEvents extends Object3D {
  constructor(camera, renderer) {
    super();
    this.debug = false;
    this.camera = camera;
    this.renderer = renderer;
    this.renderer.localClippingEnabled = true;
    this.domElement = renderer.domElement;
    this.domElement.style.touchAction = 'none'; // disable touch scroll

    this.va = new Vector2();
    this.vb = new Vector2();

    this.q = new Quaternion();
    this.p = new Vector3();
    this.n = new Vector3();
    this.plane = new Plane(new Vector3(0, 0, 1.0), 0.0);

    this.raycaster = new Raycaster();
    this.getPointer = this.getPointer.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onTap = this.onTap.bind(this);
    this.update = this.update.bind(this);
    this.init();
  }

  getDelta(pointerA, pointerB) {
    this.va.x = pointerA.x;
    this.va.y = pointerA.y;
    this.vb.x = pointerB.x;
    this.vb.y = pointerB.y;
    this.vb.sub(this.va);
    return this.vb.length();
  }

  getScreenZ(camera) {
    if (camera.isPerspectiveCamera) {
      let e = camera.matrixWorldInverse.elements;
      let z = e[14] / e[15];
      e = camera.projectionMatrix.elements;
      return (e[10] * z + e[14]) / (e[11] * z + e[15]);
    } else if (camera.isOrthographicCamera) {
      return (camera.near + camera.far) / (camera.near - camera.far);
    }
  }

  getPointer(e) {
    if (this.domElement.ownerDocument.pointerLockElement) {
      return {
        x: 0.0,
        y: 0.0,
        z: this.getScreenZ(this.camera),
        button: e.button
      };
    } else {
      const rect = this.domElement.getBoundingClientRect();
      return {
        x: e.clientX / rect.width * 2 - 1,
        y: - e.clientY / rect.height * 2 + 1,
        // for setFromCamera have no effect because setFromCamera( has coords.x and coords.y only ...)
        // but for unproject z is strongly! see move proc
        z: this.getScreenZ(this.camera),
        button: e.button
      };
    }
  }

  onPointerDown(e) {
    if (this.debug) console.log("onPointerDown");
    this.isTap = true;
    if (!document.pointerLockElement) {
      this.domElement.setPointerCapture(e.pointerId);
    }
    const pointer = this.getPointer(e);
    this.startPointer = pointer;
    if (this.intersect(pointer)) {
      this.domElement.addEventListener('pointermove', this.onPointerMove);
      this.domElement.addEventListener('pointerup', this.onPointerUp);
      this.dispatchEvent({ type: onPointer, onChange: true });
    }
  }

  onPointerUp(e) {
    if (this.debug) console.log("onPointerUp");
    this.startPointer = undefined;
    this.ipoint = undefined;
    this.domElement.releasePointerCapture(e.pointerId);
    this.domElement.removeEventListener(pointerMove, this.onPointerMove);
    this.domElement.removeEventListener(pointerUp, this.onPointerUp);
    this.dispatchEvent({ type: onPointer, onChange: false });
    if (!this.isTap) {
      this.hoverClear();
      return;
    }
    // event on Tap!!!
    this.onTap(e);

  }

  onMouseMove(e) {
    switch (e.pointerType) {
      case 'mouse':
        // case 'pen':
        if (e.pressure === 0) {
          const pointer = this.getPointer(e);
          this.intersect(pointer);
        }
        this.isTap = false;
        break;
    }
  }

  onPointerMove(e) {
    switch (e.pointerType) {
      case 'mouse':
      case 'touch':
        const pointer = this.getPointer(e);
        this.current && this.current.move && this.current.move(this.startPointer, pointer, this.camera, this.ipoint);
        this.startPointer = pointer;

        // if (delta < tapTreshold) return;
        this.dispatchEvent({ type: onPointer, onChange: true });
        if (this.debug) console.log("onPointerMove");
        this.isTap = false;
        break;
    }
  }

  onTap(e) {
    if (this.debug) console.log("onTap");
  }

  intersect(pointer) {
    this.raycaster.setFromCamera(pointer, this.camera);
    const intersect = this.raycaster.intersectObjects(this.children, true);
    if (intersect.length > 0) {
      const items = intersect;
      this.ipoint = intersect[0].point;
      this.hover(items);
      return true;
    } else {
      this.hoverClear();
      return false;
    }
  }

  hover(items) {
    const item = items[0].object.parent;
    if (item.select) {
      this.hoverClear();
      item.select();
      this.current = item;
    }
  }

  hoverClear() {
    this.current && this.current.unselect && this.current.unselect();
    this.current = undefined;
  }

  init() {
    this.domElement.addEventListener(pointerDown, this.onPointerDown);
    this.domElement.addEventListener(pointerMove, this.onMouseMove);
  }

  dispose() {
    this.domElement.removeEventListener(pointerDown, this.onPointerDown);
    this.domElement.removeEventListener(pointerMove, this.onMouseMove);
  }

  update() {
    this.n.set(0, 0, 1);
    this.n.applyQuaternion(this.camera.quaternion);
    this.plane.normal.copy(this.n);
    const s = { x: 1, y: 1, z: 1 };
    this.matrixWorld.decompose(this.p, this.q, s);
    this.plane.constant = - this.n.dot(this.p);
    this.torusN && this.torusN.quaternion.copy(this.camera.quaternion);
    this.torusN && this.torusN.applyQuaternion(this.q.invert());
  }

}

class AtomiControls extends ControlEvents {
  constructor(camera, renderer, radius) {
    super(camera, renderer);
    const q = new Quaternion();

    this.radius = radius || 0.2;

    this.torusN = new TorusGroup(this.radius, this.plane);
    this.torusN.children[0].material.color.setHex(0x999999);
    this.torusN.name = "torusN";
    this.add(this.torusN);

    const torusZ = new TorusGroup(this.radius, this.plane);
    torusZ.name = "torusZ";
    this.add(torusZ);

    const torusY = new TorusGroup(this.radius, this.plane);
    q.setFromAxisAngle(ex, Math.PI / 2);
    torusY.applyQuaternion(q);
    torusY.name = "torusY";
    this.add(torusY);

    const torusX = new TorusGroup(this.radius, this.plane);
    q.setFromAxisAngle(ey, Math.PI / 2);
    torusX.applyQuaternion(q);
    torusX.name = "torusX";
    this.add(torusX);

    const arrowX = new ArrowGroup(this.radius, this.plane);
    arrowX.name = "arrowX";
    this.add(arrowX);

    const arrowY = new ArrowGroup(this.radius, this.plane);
    q.setFromAxisAngle(ez, Math.PI / 2);
    arrowY.applyQuaternion(q);
    arrowY.name = "arrowY";
    this.add(arrowY);

    const arrowZ = new ArrowGroup(this.radius, this.plane);
    q.setFromAxisAngle(ey, Math.PI / 2);
    arrowZ.applyQuaternion(q);
    arrowZ.name = "arrowZ";
    this.add(arrowZ);
  }

  hover(items) {
    super.hover(items);
  }

  hoverClear() {
    super.hoverClear();
  }

}

export { AtomiControls };
