# AtomiControl
Position / Transformation Controls for Thee JS

# Demo
![](https://github.com/atomicra/AtomiControl/blob/main/AtomiControlSmall.gif)

# Usage
```...
import { AtomiControl } from "atomicontrol/build/atomicontrol";
    ...
    this.control = new ArcballControls(this.camera, this.domElement);
    ...
    let g = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    let m = new THREE.MeshPhongMaterial({ map: texture });

    this.cube = new THREE.Mesh(g, m);
    this.scene.add(this.cube);

    const raduis = 0.2;
    this.gizmo = new AtomiControl(this.camera, this.renderer, raduis);
    this.gizmo.addEventListener("onpointer", ({ onChange }) => {
      this.control.enabled = !onChange;
    });

    this.cube.add(this.gizmo);

    
  animate() {
    ...
    this.gizmo.update();
    ...
  }
```