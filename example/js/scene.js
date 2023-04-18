import * as THREE from "three";

import { ArcballControls } from "three/examples/jsm/controls/ArcballControls.js";
import { AtomiControls } from "src/AtomiControls.js";
import Stats from "stats";

class Gl {

  constructor(...props) {
    this.domElement = document.getElementById("three");
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    this.domElement.appendChild(this.stats.dom);
    this.stats.dom.style.cssText = 'position:fixed;top:0px;right:0;cursor:pointer;opacity:0.9;z-index:10000';

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.domElement.offsetWidth, this.domElement.offsetHeight);
    this.domElement.appendChild(this.renderer.domElement);

    const texture = new THREE.TextureLoader().load('textures/crate.gif', () => {/*this.animate*/ });
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    this.scene = new THREE.Scene();
    this.ambientLight = new THREE.AmbientLight(0x555555);
    this.pointLight = new THREE.PointLight(0xffffff, 1.3, 100, 2);

    const aspect = this.domElement.offsetWidth / this.domElement.offsetHeight;

    // this.camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 5);
    // this.camera.name = 'orthoCamera';

    this.camera = new THREE.PerspectiveCamera();
    this.camera.name = 'perspectiveCamera';
    this.camera.aspect = aspect;

    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0, 2);
    this.camera.add(this.pointLight);
    this.scene.add(this.camera);

    this.control = new ArcballControls(this.camera, this.domElement);
    this.control.setGizmosVisible(false);
    this.control.gizmoVisible = false;
    this.control.dampingFactor = 15;
    this.control.wMax = 35;	//maximum angular velocity allowed

    this.scene.add( new THREE.GridHelper( 2, 20, 0x888888, 0x444444 ) );

    let g = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    let m = new THREE.MeshPhongMaterial({ wireframe: false, map: texture});

    this.cube = new THREE.Mesh(g, m);
    this.scene.add(this.cube);

    const raduis = 0.2;
    this.gizmo = new AtomiControls(this.camera, this.renderer, raduis);
    this.gizmo.addEventListener("onpointer", ({ onChange }) => {
      this.control.enabled = !onChange;
    });

    this.cube.add(this.gizmo);

    this.animate = this.animate.bind(this);
    this.resize = this.resize.bind(this);
    this.renderer.setAnimationLoop(() => { this.animate() });
    window.addEventListener('resize', this.resize, false); //
  }


  resize() {

    const aspect = this.domElement.offsetWidth / this.domElement.offsetHeight;

    this.renderer.setSize(this.domElement.offsetWidth, this.domElement.offsetHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = aspect;
    } else if (this.camera.isOrthographicCamera) {
      this.camera.right = aspect;
      this.camera.left = -this.camera.right;
      this.camera.top = 1;
      this.camera.bottom = -this.camera.top;
    }

    this.camera.updateProjectionMatrix();
  }

  animate() {
    this.stats.begin();
    this.control.update();
    this.gizmo.update();
    this.stats.end();
    this.renderer.render(this.scene, this.camera);
  }

}

window.gl = new Gl();