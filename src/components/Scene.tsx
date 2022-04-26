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

const Scene = () => {
  const canvasRef = useRef<any>();
  const [renderer, setRenderer] = useState<any>(null);
  const [camera] = useState<any>(
    new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
  );
  const [scene] = useState(new THREE.Scene());
  const [world] = useState(new CANNON.World());
  const [normalMaterial] = useState(new THREE.MeshNormalMaterial());
  const [phongMaterial] = useState(new THREE.MeshPhongMaterial());
  const [planePhyMaterial] = useState(new CANNON.Material());
  const [wallPhyMaterial] = useState(new CANNON.Material());
  const [clock] = useState(new THREE.Clock());

  const handleResize = useCallback(() => {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer?.setSize(window.innerWidth, window.innerHeight);
    render();
  }, [renderer]);

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
  }, [canvasRef]);

  const configScene = () => {
    scene.background = new THREE.Color(0xaaaaaa);
  };

  const configRenderer = () => {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  };

  const configWorld = () => {
    world.gravity.set(0, -9.82, 0);
  };

  const setCameraPos = () => {
    camera.position.set(-25, 25, 0);
  };

  const render = () => {
    renderer.render(scene, camera);
  };

  const getCameraControlls = () => {
    // Control Camera
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true;
    controls.target.y = 2;
    return controls;
  };

  const getCameraController = () => {
    const cameraController = new THREE.Object3D();
    cameraController.add(camera);
    return cameraController;
  };

  const updateCamera = (cameraContoller: any, characterBody: Body) => {
    cameraContoller.position.copy(characterBody.position as any);
  };

  const gltfLoad = async (url: string) => {
    const loader = new GLTFLoader();
    return await loader.loadAsync(url);
  };

  useEffect(() => {
    if (!renderer) return;
    handleResize();
    configScene();
    configRenderer();
    configWorld();
    setCameraPos();

    addToScene();
  }, [renderer]);

  const addToScene = async () => {
    axisHelper();
    lightLoad();
    planeLoad();
    const { wallBody } = wallLoad();
    const soldier = await soliderLoad();
    const { cylinder, cube, sphere } = characherLoad();

    //----------------------------------animate-----------------------------------
    const controls = getCameraControlls();
    const cameraController = getCameraController();
    const cannonDebugRenderer = new CannonDebugRenderer(scene, world);
    let delta;
    let isDragging = false;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      updateCamera(cameraController, soldier.body);
      delta = Math.min(clock.getDelta(), 0.1);
      world.step(delta);
      cannonDebugRenderer.update();
      soldier.mixer.update(delta);

      if (isDragging) {
        soldier.body.position.set(
          soldier.model.position.x,
          soldier.model.position.y,
          soldier.model.position.z
        );
        soldier.model.quaternion.set(
          soldier.model.quaternion.x,
          soldier.model.quaternion.y,
          soldier.model.quaternion.z,
          soldier.model.quaternion.w
        );
        // soldier.model.rotation.set(0, Math.PI / 2, 0);
      } else {
        // world.removeBody(soldier.body);
        // const newSoldier = getBoundingPhysicsBody(soldier.model);
        // soldier.body = newSoldier.body;
        soldier.model.position.set(
          soldier.body.position.x as number,
          (soldier.body.position.y as number) - soldier.dimensions.y / 2,
          soldier.body.position.z as number
        );
        soldier.model.quaternion.set(
          soldier.body.quaternion.x as number,
          soldier.body.quaternion.y as number,
          soldier.body.quaternion.z as number,
          soldier.body.quaternion.w as number
        );
      }

      // Copy coordinates from Cannon to Three.js
      cylinder.cylMesh.position.set(
        cylinder.cylBody.position.x,
        cylinder.cylBody.position.y,
        cylinder.cylBody.position.z
      );
      cylinder.cylMesh.quaternion.set(
        cylinder.cylBody.quaternion.x,
        cylinder.cylBody.quaternion.y,
        cylinder.cylBody.quaternion.z,
        cylinder.cylBody.quaternion.w
      );
      cube.cubeMesh.position.set(
        cube.cubeBody.position.x,
        cube.cubeBody.position.y,
        cube.cubeBody.position.z
      );
      cube.cubeMesh.quaternion.set(
        cube.cubeBody.quaternion.x,
        cube.cubeBody.quaternion.y,
        cube.cubeBody.quaternion.z,
        cube.cubeBody.quaternion.w
      );
      sphere.sphereMesh.position.set(
        sphere.sphereBody.position.x,
        sphere.sphereBody.position.y,
        sphere.sphereBody.position.z
      );
      sphere.sphereMesh.quaternion.set(
        sphere.sphereBody.quaternion.x,
        sphere.sphereBody.quaternion.y,
        sphere.sphereBody.quaternion.z,
        sphere.sphereBody.quaternion.w
      );

      render();
    };

    animate();
  };

  const axisHelper = () => {
    scene.add(new THREE.AxesHelper(50));
  };

  const lightLoad = () => {
    const light1 = new THREE.SpotLight();
    light1.position.set(0, 20, 0);
    scene.add(light1);
    const light2 = new THREE.AmbientLight();
    scene.add(light2);

    return [light1, light2];
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
      shape: new CANNON.Plane(),
      material: planePhyMaterial,
    });
    planeBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    world.addBody(planeBody);

    return {
      planeGeometry,
      planeMesh,
      planeBody,
    };
  };

  const wallLoad = () => {
    // Wall
    const wallGeometry = new THREE.BoxGeometry(1, 10, 25);
    const wallMesh = new THREE.Mesh(wallGeometry, normalMaterial);
    wallMesh.position.set(10, 5, 0);
    scene.add(wallMesh);

    const wallBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 5, 12.5)),
      material: wallPhyMaterial,
    });
    wallBody.position.set(
      wallMesh.position.x,
      wallMesh.position.y,
      wallMesh.position.z
    );
    world.addBody(wallBody);

    return {
      wallGeometry,
      wallMesh,
      wallBody,
    };
  };

  const setWeight = (action: THREE.AnimationAction, weight: number) => {
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
  };

  const activateAllActions = (actions: THREE.AnimationAction[]) => {
    setWeight(actions[0], 0);
    setWeight(actions[1], 1);
    setWeight(actions[2], 0);

    actions.forEach(function (action) {
      action.play();
    });
  };

  const getBoundingPhysicsBody = (model: any) => {
    const boundingBox = new THREE.Box3().setFromObject(model);
    const dimensions = new THREE.Vector3().subVectors(
      boundingBox.max,
      boundingBox.min
    );
    // const boxGeo = new THREE.BoxBufferGeometry(
    //   dimensions.x,
    //   dimensions.y,
    //   dimensions.z
    // );
    // const matrix = new THREE.Matrix4().setPosition(
    //   dimensions
    //     .addVectors(boundingBox.min, boundingBox.max)
    //     .multiplyScalar(0.5)
    // );
    // boxGeo.applyMatrix4(matrix);
    // var bomesh = new THREE.Mesh(boxGeo);
    // bomesh.position.set(model.position.x, model.position.y, model.position.z);
    // scene.add(bomesh);

    const physMat = new CANNON.Material();
    const body = new CANNON.Body({
      mass: 78,
      shape: new CANNON.Box(
        new CANNON.Vec3(dimensions.x / 2, dimensions.y / 2, dimensions.z / 2)
      ),
      fixedRotation: true,
      material: physMat,
    });
    body.position.set(
      model.position.x,
      model.position.y + dimensions.y / 2,
      model.position.z
    );
    const groundSoldierContactMat = new CANNON.ContactMaterial(
      planePhyMaterial,
      physMat,
      { friction: 0.02 }
    );
    world.addBody(body);
    world.addContactMaterial(groundSoldierContactMat);

    return {
      dimensions,
      body,
    };
  };

  const soliderLoad = async () => {
    const gltf: any = await gltfLoad("/assets/Soldier.glb");
    const model = gltf.scene;
    // model.scale.set(0.1, 0.1, 0.1);
    // model.rotation.set(0, Math.PI / 2, 0);
    model.rotateY(-Math.PI / 2);
    model.position.set(-10, 15, 0);
    model.traverse(function (object: any) {
      if (object.isMesh) object.castShadow = true;
    });
    const animations = gltf.animations;
    const mixer = new THREE.AnimationMixer(model);

    const idleAction = mixer.clipAction(animations[0]);
    const walkAction = mixer.clipAction(animations[3]);
    const runAction = mixer.clipAction(animations[1]);
    const actions = [idleAction, walkAction, runAction];
    activateAllActions(actions);
    scene.add(model);

    // Get Bounding Box and set physics
    const { body, dimensions } = getBoundingPhysicsBody(model);

    // Key Controll
    document.addEventListener("keydown", (event: any) => {
      const keyCode = event.which;
      const step = 15;
      if (keyCode === 87) {
        body.velocity.x = step;
        body.velocity.z = 0;
      } else if (keyCode === 83) {
        body.velocity.x = -step;
        body.velocity.z = 0;
      } else if (keyCode === 65) {
        body.velocity.z = -step;
        body.velocity.x = 0;
      } else if (keyCode === 68) {
        body.velocity.z = step;
        body.velocity.x = 0;
      } else if (keyCode === 32) {
        body.position.set(0, 0, 0);
      }
    });

    return {
      model,
      body,
      dimensions,
      mixer,
      actions,
      idleAction,
      walkAction,
      runAction,
    };
  };

  const collisionDetectionWithWall = (targetObj: Body, wallBody: Body) => {
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
    const cylGeometry = new THREE.CylinderGeometry(0.5, 5, 3, 16);
    const cylMesh = new THREE.Mesh(cylGeometry, normalMaterial);
    cylMesh.position.x = -3;
    cylMesh.position.y = 7;
    cylMesh.castShadow = true;
    scene.add(cylMesh);

    const physMat = new CANNON.Material();
    const cylBody = new CANNON.Body({
      mass: 1000,
      shape: new CANNON.Cylinder(0.5, 5, 3, 16),
      material: physMat,
    });
    cylBody.position.set(
      cylMesh.position.x,
      cylMesh.position.y,
      cylMesh.position.z
    );
    world.addBody(cylBody);
    const groundCharContactMat = new CANNON.ContactMaterial(
      planePhyMaterial,
      physMat,
      {}
    );
    world.addContactMaterial(groundCharContactMat);

    // Cube
    const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
    const cubeMesh = new THREE.Mesh(cubeGeometry, normalMaterial);
    cubeMesh.position.x = -3;
    cubeMesh.position.y = 15;
    cubeMesh.position.z = 9;
    cubeMesh.castShadow = true;
    scene.add(cubeMesh);

    const cubePhysMat = new CANNON.Material();
    const cubeBody = new CANNON.Body({
      mass: 1200,
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
      {}
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

    const spherePhysMat = new CANNON.Material();
    const sphereBody = new CANNON.Body({
      mass: 670,
      shape: new CANNON.Sphere(1),
    });
    sphereBody.position.set(
      sphereMesh.position.x,
      sphereMesh.position.y,
      sphereMesh.position.z
    );
    world.addBody(sphereBody);
    const sphereCubeContactMat = new CANNON.ContactMaterial(
      planePhyMaterial,
      spherePhysMat,
      {}
    );
    world.addContactMaterial(sphereCubeContactMat);

    // let isCollidedWithWall = false;
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

    // world.addEventListener("beginContact", (event: any) => {
    //   if (collisionDetectionWithWall(body, wallBody)) {
    //     isCollidedWithWall = true;
    //   }
    // });

    // world.addEventListener("endContact", (event: any) => {
    //   if (isCollidedWithWall && !collisionDetectionWithWall(body, wallBody)) {
    //     setTimeout(() => {
    //       isCollidedWithWall = false;
    //     }, 1000);
    //   }
    // });

    // body.addEventListener("collide", (event: any) => {
    //   if (!wallBody) return;
    //   const contact = event.contact;
    //   if ([contact.bi.id, contact.bj.id].includes(wallBody.id)) {
    //     isCollided = true;
    //   } else isCollided = false;
    // });

    return {
      cylinder: {
        cylGeometry,
        cylMesh,
        cylBody,
      },
      cube: {
        cubeGeometry,
        cubeMesh,
        cubeBody,
      },
      sphere: {
        sphereGeometry,
        sphereMesh,
        sphereBody,
      },
    };
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
