import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as CANNON from "cannon-es";
import CannonUtils from "../cannon/utils/cannonUtils";
import CannonDebugRenderer from "../cannon/utils/cannonDebugRenderer";
import { Body, Trimesh } from "cannon-es";
import { DragControls } from "three/examples/jsm/controls/DragControls";

interface ISoldierAction {
  idleAction: THREE.AnimationAction;
  walkAction: THREE.AnimationAction;
  runAction: THREE.AnimationAction;
}

interface ISoldier {
  loader: GLTFLoader;
  model?: THREE.Group;
  animations?: THREE.AnimationClip[];
  actions?: ISoldierAction;
  loaded?: Boolean;
  soldierMesh?: THREE.Mesh;
  soldierBody?: CANNON.Body;
}

let soldier: ISoldier = {
  loader: new GLTFLoader(),
};

const Scene = () => {
  const canvasRef = useRef<any>();
  const [renderer, setRenderer] = useState<any>(null);
  const [camera, setCamera] = useState<any>(null);
  const [scene] = useState(new THREE.Scene());
  const [world] = useState(new CANNON.World());
  const [normalMaterial] = useState(new THREE.MeshNormalMaterial());
  const [phongMaterial] = useState(new THREE.MeshPhongMaterial());
  const [planePhyMaterial] = useState(new CANNON.Material());
  const [wallPhyMaterial] = useState(new CANNON.Material());
  const [wallBody] = useState<any>(
    new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 5, 12.5)),
      material: wallPhyMaterial,
    })
  );

  const handleResize = useCallback(() => {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer?.setSize(window.innerWidth, window.innerHeight);
    render();
  }, [camera, renderer]);

  useEffect(() => {
    window.addEventListener("resize", handleResize, false);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    if (!canvasRef) return;
    setRenderer(
      new THREE.WebGLRenderer({
        canvas: canvasRef.current,
      })
    );
    setCamera(
      new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
    );
  }, [canvasRef]);

  const configScene = () => {
    scene.background = new THREE.Color(0xaaaaaa);
  };

  const configRenderer = () => {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  };

  const setCameraPos = () => {
    camera.position.set(-25, 25, 0);
    // camera.lookAt(10, 10, 16);
  };

  const addToScene = () => {
    scene.add(new THREE.AxesHelper(5));
    world.gravity.set(0, -9.82, 0);
    lightLoad();
    // soliderLoad();
    planeLoad();
    wallLoad();
    characherLoad();
    // tmpColiObjectsLoad();
  };

  useEffect(() => {
    if (!renderer || !camera) return;
    handleResize();
    configScene();
    configRenderer();
    setCameraPos();
    addToScene();
  }, [renderer, camera]);

  const render = () => {
    renderer.render(scene, camera);
  };

  const soliderLoad = () => {
    // Load a glTF resource
    soldier.loader.load(
      // resource URL
      "/assets/Cat.glb",
      // called when the resource is loaded
      function (gltf) {
        const model = gltf.scene;
        // model.position.set(-2, 15, 0);
        // const animations = gltf.animations;
        // const mixer = new THREE.AnimationMixer(model);

        const mesh = model.children[0] as THREE.Mesh;
        // mesh.material = normalMaterial;
        mesh.scale.set(1, 1, 1);
        mesh.position.set(-2, 10, 0);
        mesh.castShadow = true;
        scene.add(mesh);

        // const shape = CannonUtils.CreateTrimesh((mesh as THREE.Mesh).geometry);
        // const body = new CANNON.Body({ mass: 18 });
        // body.addShape(shape);
        // body.position.x = mesh.position.x;
        // body.position.y = mesh.position.y;
        // body.position.z = mesh.position.z;
        // world.addBody(body);

        const positions = mesh.geometry.attributes.position.array;
        const points: THREE.Vector3[] = [];
        for (let i = 0; i < positions.length; i += 3) {
          points.push(
            new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2])
          );
        }
        const convexHull = new ConvexGeometry(points);

        const body = new CANNON.Body({
          mass: 18,
          shape: CannonUtils.CreateConvexPolyhedron(convexHull),
        });

        body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
        world.addBody(body);

        // model.traverse(function (object) {
        //   if (object instanceof THREE.Mesh) {
        //     // const geometry = new THREE.BufferGeometry(object.geometry);
        //     object.castShadow = true;
        //   }
        // });

        soldier = {
          ...soldier,
          model,
          // animations,
          // actions: {
          //   idleAction: mixer.clipAction(animations[0]),
          //   walkAction: mixer.clipAction(animations[3]),
          //   runAction: mixer.clipAction(animations[1]),
          // },
          soldierMesh: mesh,
          soldierBody: body,
          loaded: true,
        };
      },
      // called while loading is progressing
      function (xhr) {},
      // called when loading has errors
      function (error) {
        console.log("An error happened", error);
      }
    );
  };

  const lightLoad = () => {
    const light1 = new THREE.SpotLight();
    light1.position.set(0, 20, 0);
    // light1.intensity = 1;
    // light1.angle = Math.PI / 4;
    // light1.penumbra = 0.5;
    // light1.castShadow = true;
    // light1.shadow.mapSize.width = 1024;
    // light1.shadow.mapSize.height = 1024;
    // light1.shadow.camera.near = 0.5;
    // light1.shadow.camera.far = 50;
    scene.add(light1);

    // const light2 = new THREE.SpotLight();
    // light2.position.set(-2.5, 5, 5);
    // light2.angle = Math.PI / 4;
    // light2.penumbra = 0.5;
    // light2.castShadow = true;
    // light2.shadow.mapSize.width = 1024;
    // light2.shadow.mapSize.height = 1024;
    // light2.shadow.camera.near = 0.5;
    // light2.shadow.camera.far = 50;
    // scene.add(light2);

    const light3 = new THREE.AmbientLight();
    // light1.intensity = 1;
    // light1.angle = Math.PI / 4;
    // light1.penumbra = 0.5;
    // light1.castShadow = true;
    // light1.shadow.mapSize.width = 1024;
    // light1.shadow.mapSize.height = 1024;
    // light1.shadow.camera.near = 0.5;
    // light1.shadow.camera.far = 50;
    scene.add(light3);
  };

  const planeLoad = () => {
    // Floor
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
    planeMesh.rotateX(-Math.PI / 2);
    planeMesh.receiveShadow = true;
    scene.add(planeMesh);

    const planeBody = new CANNON.Body({
      mass: 0,
      // shape: new CANNON.Box(new CANNON.Vec3(25, 25, 0.1)),
      shape: new CANNON.Plane(),
      material: planePhyMaterial,
    });
    planeBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    world.addBody(planeBody);
  };

  const wallLoad = () => {
    // Wall
    if (!wallBody) return;

    const wallGeometry = new THREE.BoxGeometry(1, 10, 25);
    const wallMesh = new THREE.Mesh(wallGeometry, normalMaterial);
    wallMesh.position.set(10, 5, 0);
    scene.add(wallMesh);
    wallBody.position.set(
      wallMesh.position.x,
      wallMesh.position.y,
      wallMesh.position.z
    );
    world.addBody(wallBody);
  };

  const collisionDetectionWithWall = (targetObj: Body) => {
    let isCollided = false;
    for (var i = 0; i < world.contacts.length; i++) {
      var c = world.contacts[i];
      if (
        [c.bi.id, c.bj.id].includes(wallBody.id) &&
        [c.bi.id, c.bj.id].includes(targetObj.id)
      ) {
        isCollided = true;
        break;
      }
    }
    return isCollided;
  };

  const characherLoad = () => {
    // Cylinder
    const geometry = new THREE.CylinderGeometry(0.5, 5, 3, 16);
    const mesh = new THREE.Mesh(geometry, normalMaterial);
    mesh.position.x = -3;
    mesh.position.y = 7;
    mesh.castShadow = true;
    scene.add(mesh);

    const physMat = new CANNON.Material();
    const body = new CANNON.Body({
      mass: 10,
      shape: new CANNON.Cylinder(0.5, 5, 3, 16),
      material: physMat,
    });
    body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
    world.addBody(body);

    const groundCharContactMat = new CANNON.ContactMaterial(
      planePhyMaterial,
      physMat,
      { friction: 0 }
    );
    world.addContactMaterial(groundCharContactMat);

    // Cube
    const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
    const cubeMesh = new THREE.Mesh(cubeGeometry, normalMaterial);
    cubeMesh.position.x = -5;
    cubeMesh.position.y = 15;
    cubeMesh.position.z = 8;
    cubeMesh.castShadow = true;
    scene.add(cubeMesh);

    const cubePhysMat = new CANNON.Material();
    const cubeBody = new CANNON.Body({
      mass: 12,
      shape: new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 2.5)),
      material: cubePhysMat,
    });
    cubeBody.position.set(
      cubeMesh.position.x,
      cubeMesh.position.y,
      cubeMesh.position.z
    );
    world.addBody(cubeBody);

    const groundCubeContactMat = new CANNON.ContactMaterial(
      planePhyMaterial,
      cubePhysMat,
      { friction: 0.04 }
    );
    world.addContactMaterial(groundCubeContactMat);

    // Sphere
    const sphereGeometry = new THREE.SphereGeometry();
    const sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
    sphereMesh.position.x = -10;
    sphereMesh.position.y = 20;
    sphereMesh.position.z = -8;
    sphereMesh.castShadow = true;
    scene.add(sphereMesh);

    const sphereBody = new CANNON.Body({
      mass: 11,
      shape: new CANNON.Sphere(1),
    });
    sphereBody.position.set(
      sphereMesh.position.x,
      sphereMesh.position.y,
      sphereMesh.position.z
    );
    world.addBody(sphereBody);

    // // Icosahedron
    // const icosahedronGeometry = new THREE.IcosahedronGeometry(1, 0);
    // const icosahedronMesh = new THREE.Mesh(icosahedronGeometry, normalMaterial);
    // icosahedronMesh.position.x = 1.2;
    // icosahedronMesh.position.y = 10;
    // icosahedronMesh.castShadow = true;
    // scene.add(icosahedronMesh);

    // const position = icosahedronMesh.geometry.attributes.position.array;
    // const icosahedronPoints: CANNON.Vec3[] = [];
    // for (let i = 0; i < position.length; i += 3) {
    //   icosahedronPoints.push(
    //     new CANNON.Vec3(position[i], position[i + 1], position[i + 2])
    //   );
    // }
    // const icosahedronFaces: number[][] = [];
    // for (let i = 0; i < position.length / 3; i += 3) {
    //   icosahedronFaces.push([i, i + 1, i + 2]);
    // }
    // const icosahedronShape = new CANNON.ConvexPolyhedron({
    //   vertices: icosahedronPoints,
    //   faces: icosahedronFaces,
    // });
    // const icosahedronBody = new CANNON.Body({ mass: 1 });
    // icosahedronBody.addShape(icosahedronShape);
    // icosahedronBody.position.x = icosahedronMesh.position.x;
    // icosahedronBody.position.y = icosahedronMesh.position.y;
    // icosahedronBody.position.z = icosahedronMesh.position.z;
    // world.addBody(icosahedronBody);

    // Control Camera
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true;
    controls.target.y = 2;

    const cameraContoller = new THREE.Object3D();
    cameraContoller.add(camera);

    let isDragging = false;
    let isCollidedWithWall = false;

    // const dragControls = new DragControls([mesh], camera, renderer.domElement);
    // dragControls.addEventListener("dragstart", function (event: THREE.Event) {
    //   isDragging = true;
    //   event.object.material.opacity = 0.33;
    //   controls.enabled = false;
    // });

    // dragControls.addEventListener("dragend", function (event: THREE.Event) {
    //   isDragging = false;
    //   event.object.material.opacity = 1;
    //   controls.enabled = true;
    // });

    // dragControls.addEventListener("drag", function (event: any) {
    //   // if (collisionDetectionWithWall(body)) {
    //   //   isCollidedWithWall = true;
    //   // }
    //   if (isCollidedWithWall) {
    //     // if (event.object.position.x >= wallBody.position.x - 1.5)
    //     event.object.position.x = wallBody.position.x - 1.51;
    //     // if (event.object.position.x <= wallBody.position.x + 1.5)
    //   }
    //   event.object.position.y = 1.5;
    // });

    document.addEventListener("keydown", (event: any) => {
      const keyCode = event.which;
      var localVelocity = new CANNON.Vec3(0, 0, 0);
      // let accelerationX = 0,
      //   accelerationZ = 0;
      const step = 5;
      if (keyCode == 87) {
        body.velocity.x = step;
        body.velocity.z = 0;
        // localVelocity.x = step;
        // accelerationX = step;
      } else if (keyCode == 83) {
        body.velocity.x = -step;
        body.velocity.z = 0;
        // localVelocity.x = -step;
        // accelerationX = -step;
      } else if (keyCode == 65) {
        body.velocity.z = -step;
        body.velocity.x = 0;
        // localVelocity.z = -step;
        // accelerationZ = -step;
      } else if (keyCode == 68) {
        body.velocity.z = step;
        body.velocity.x = 0;
        // localVelocity.z = step;
        // accelerationZ = step;
      } else if (keyCode == 32) {
        body.position.set(0, 0, 0);
      }
      // if ([87, 83, 65, 68].includes(keyCode)) {
      //   body.quaternion.vmult(localVelocity, body.velocity);
      //   // var accelerationImpulse = new CANNON.Vec3(
      //   //   accelerationX,
      //   //   0,
      //   //   accelerationZ
      //   // );
      //   // var accelerationImpulse = body.quaternion.vmult(accelerationImpulse);
      //   // var bodyCenter = new CANNON.Vec3(
      //   //   body.position.x,
      //   //   body.position.y,
      //   //   body.position.z
      //   // );
      //   // body.applyImpulse(accelerationImpulse, bodyCenter);
      //   // updateCamera();
      // }
    });

    const updateCamera = () => {
      cameraContoller.position.copy(body.position as any);
      // controls.target.x = body.position.x;
      // cameraContoller.position.y = 0;
      // cameraTarget.z += 6;
      // camera.lookAt(cameraTarget);
    };

    world.addEventListener("beginContact", (event: any) => {
      if (collisionDetectionWithWall(body)) {
        isCollidedWithWall = true;
      }
    });

    world.addEventListener("endContact", (event: any) => {
      if (isCollidedWithWall && !collisionDetectionWithWall(body)) {
        setTimeout(() => {
          isCollidedWithWall = false;
        }, 1000);
      }
    });

    // body.addEventListener("collide", (event: any) => {
    //   if (!wallBody) return;
    //   const contact = event.contact;
    //   if ([contact.bi.id, contact.bj.id].includes(wallBody.id)) {
    //     isCollided = true;
    //   } else isCollided = false;
    // });

    const cannonDebugRenderer = new CannonDebugRenderer(scene, world);

    const clock = new THREE.Clock();
    let delta;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      updateCamera();
      //delta = clock.getDelta()
      delta = Math.min(clock.getDelta(), 0.1);
      world.step(delta);
      cannonDebugRenderer.update();

      // Copy coordinates from Cannon to Three.js
      if (isDragging) {
        body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
        body.quaternion.set(
          mesh.quaternion.x,
          mesh.quaternion.y,
          mesh.quaternion.z,
          mesh.quaternion.w
        );
      } else {
        mesh.position.set(body.position.x, body.position.y, body.position.z);
        mesh.quaternion.set(
          body.quaternion.x,
          body.quaternion.y,
          body.quaternion.z,
          body.quaternion.w
        );
      }

      cubeMesh.position.set(
        cubeBody.position.x,
        cubeBody.position.y,
        cubeBody.position.z
      );
      cubeMesh.quaternion.set(
        cubeBody.quaternion.x,
        cubeBody.quaternion.y,
        cubeBody.quaternion.z,
        cubeBody.quaternion.w
      );
      sphereMesh.position.set(
        sphereBody.position.x,
        sphereBody.position.y,
        sphereBody.position.z
      );
      sphereMesh.quaternion.set(
        sphereBody.quaternion.x,
        sphereBody.quaternion.y,
        sphereBody.quaternion.z,
        sphereBody.quaternion.w
      );
      // icosahedronMesh.position.set(
      //   icosahedronBody.position.x,
      //   icosahedronBody.position.y,
      //   icosahedronBody.position.z
      // );
      // icosahedronMesh.quaternion.set(
      //   icosahedronBody.quaternion.x,
      //   icosahedronBody.quaternion.y,
      //   icosahedronBody.quaternion.z,
      //   icosahedronBody.quaternion.w
      // );

      if (soldier.loaded) {
        soldier.soldierMesh?.position.set(
          soldier.soldierBody?.position.x as number,
          soldier.soldierBody?.position.y as number,
          soldier.soldierBody?.position.z as number
        );
        soldier.soldierMesh?.quaternion.set(
          soldier.soldierBody?.quaternion.x as number,
          soldier.soldierBody?.quaternion.y as number,
          soldier.soldierBody?.quaternion.z as number,
          soldier.soldierBody?.quaternion.w as number
        );
      }
      render();
    };
    animate();
  };

  const tmpColiObjectsLoad = () => {
    // Cube
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMesh = new THREE.Mesh(cubeGeometry, normalMaterial);
    cubeMesh.position.x = -3;
    cubeMesh.position.y = 3;
    cubeMesh.castShadow = true;
    scene.add(cubeMesh);

    const cubePhysMat = new CANNON.Material();
    const cubeBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
      material: cubePhysMat,
    });
    cubeBody.position.set(
      cubeMesh.position.x,
      cubeMesh.position.y,
      cubeMesh.position.z
    );
    world.addBody(cubeBody);

    const groundCubeContactMat = new CANNON.ContactMaterial(
      planePhyMaterial,
      cubePhysMat,
      { friction: 0.04 }
    );
    world.addContactMaterial(groundCubeContactMat);

    // Sphere
    const sphereGeometry = new THREE.SphereGeometry();
    const sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
    sphereMesh.position.x = -1;
    sphereMesh.position.y = 2;
    sphereMesh.castShadow = true;
    scene.add(sphereMesh);

    const sphereBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(1),
    });
    sphereBody.position.set(
      sphereMesh.position.x,
      sphereMesh.position.y,
      sphereMesh.position.z
    );
    world.addBody(sphereBody);

    // Icosahedron
    const icosahedronGeometry = new THREE.IcosahedronGeometry(1, 0);
    const icosahedronMesh = new THREE.Mesh(icosahedronGeometry, normalMaterial);
    icosahedronMesh.position.x = 1.2;
    icosahedronMesh.position.y = 10;
    icosahedronMesh.castShadow = true;
    scene.add(icosahedronMesh);

    const position = icosahedronMesh.geometry.attributes.position.array;
    const icosahedronPoints: CANNON.Vec3[] = [];
    for (let i = 0; i < position.length; i += 3) {
      icosahedronPoints.push(
        new CANNON.Vec3(position[i], position[i + 1], position[i + 2])
      );
    }
    const icosahedronFaces: number[][] = [];
    for (let i = 0; i < position.length / 3; i += 3) {
      icosahedronFaces.push([i, i + 1, i + 2]);
    }
    const icosahedronShape = new CANNON.ConvexPolyhedron({
      vertices: icosahedronPoints,
      faces: icosahedronFaces,
    });
    const icosahedronBody = new CANNON.Body({ mass: 1 });
    icosahedronBody.addShape(icosahedronShape);
    icosahedronBody.position.x = icosahedronMesh.position.x;
    icosahedronBody.position.y = icosahedronMesh.position.y;
    icosahedronBody.position.z = icosahedronMesh.position.z;
    world.addBody(icosahedronBody);

    const clock = new THREE.Clock();
    let delta;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true;
    controls.target.y = 2;

    // const cannonDebugRenderer = new CannonDebugRenderer(scene, world);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      //delta = clock.getDelta()
      delta = Math.min(clock.getDelta(), 0.1);
      world.step(delta);
      // cannonDebugRenderer.update();

      // Copy coordinates from Cannon to Three.js
      cubeMesh.position.set(
        cubeBody.position.x,
        cubeBody.position.y,
        cubeBody.position.z
      );
      cubeMesh.quaternion.set(
        cubeBody.quaternion.x,
        cubeBody.quaternion.y,
        cubeBody.quaternion.z,
        cubeBody.quaternion.w
      );
      sphereMesh.position.set(
        sphereBody.position.x,
        sphereBody.position.y,
        sphereBody.position.z
      );
      sphereMesh.quaternion.set(
        sphereBody.quaternion.x,
        sphereBody.quaternion.y,
        sphereBody.quaternion.z,
        sphereBody.quaternion.w
      );
      icosahedronMesh.position.set(
        icosahedronBody.position.x,
        icosahedronBody.position.y,
        icosahedronBody.position.z
      );
      icosahedronMesh.quaternion.set(
        icosahedronBody.quaternion.x,
        icosahedronBody.quaternion.y,
        icosahedronBody.quaternion.z,
        icosahedronBody.quaternion.w
      );
      if (soldier.loaded) {
        soldier.soldierMesh?.position.set(
          soldier.soldierBody?.position.x as number,
          soldier.soldierBody?.position.y as number,
          soldier.soldierBody?.position.z as number
        );
        soldier.soldierMesh?.quaternion.set(
          soldier.soldierBody?.quaternion.x as number,
          soldier.soldierBody?.quaternion.y as number,
          soldier.soldierBody?.quaternion.z as number,
          soldier.soldierBody?.quaternion.w as number
        );
      }
      render();
    };
    animate();
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        flex: 1,
      }}
    />
  );
};

export default Scene;
