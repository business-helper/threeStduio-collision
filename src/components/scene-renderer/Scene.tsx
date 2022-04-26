import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as CANNON from "cannon-es";
import { useResizeDetector } from "react-resize-detector";
import CannonDebugRenderer from "../../cannon/utils/cannonDebugRenderer";
import { Body } from "cannon-es";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { Droppable } from "react-beautiful-dnd";
import { useDispatch, useSelector } from "react-redux";
import { ModelControl } from "../../service";
import {
  DESELECT_MODEL,
  SELECT_MODEL,
  UPDATE_MODEL,
} from "../../store/actions";
import { Model } from "../../store/modelReducer";
import { Raycaster, Vector2, Vector3 } from "three";
import React from "react";

const CanvasScene = (props: any) => {
  const { modelRedx } = props;

  const { width, height, ref } = useResizeDetector();
  const [renderer, setRenderer] = useState<any>(null);
  const [camera, setCamera] = useState<any>();
  const [scene] = useState(new THREE.Scene());
  const [world] = useState(new CANNON.World());
  const [normalMaterial] = useState(new THREE.MeshNormalMaterial());
  const [phongMaterial] = useState(new THREE.MeshPhongMaterial());
  const [planePhyMaterial] = useState(new CANNON.Material());
  const [wallPhyMaterial] = useState(new CANNON.Material());
  const [clock] = useState(new THREE.Clock());

  useEffect(() => {
    // TODO
    // update Canvas fully
  }, [modelRedx]);

  const handleResize = useCallback(() => {
    if (!renderer || !ref || !camera) return;
    camera.aspect = (width as number) / (height as number);
    camera.updateProjectionMatrix();
    renderer?.setSize(width, height);
    render();
  }, [renderer, ref, camera, width, height]);

  useEffect(() => {
    handleResize();
  }, [width, height]);

  useEffect(() => {
    if (!ref) return;
    setRenderer(
      new THREE.WebGLRenderer({
        canvas: ref.current,
      })
    );
    setCamera(
      new THREE.PerspectiveCamera(
        75,
        (width as number) / (height as number),
        0.1,
        1000
      )
    );
  }, [ref]);

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

    renderModelObjs();
    // addToScene();
  }, [renderer, modelRedx]);

  const cacluate3DPosFrom2DPos = (pos2: any) => {
    const vec3 = new Vector3();
    const pos3 = new Vector3();
    const mouse = new Vector2();
    mouse.set(
      (pos2.x / (width as number)) * 2 - 1,
      -(pos2.y / (height as number)) * 2 + 1
    );
    camera.updateMatrixWorld();
    var raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
      vec3.copy(intersects[0].point);
    }
    vec3.sub(camera.position).normalize();
    var distance = (15 - camera.position.y) / vec3.y;
    pos3.copy(camera.position).add(vec3.multiplyScalar(distance));
    return pos3;
  };

  const renderModelObjs = async () => {
    axisHelper();
    lightLoad();
    planeLoad();
    wallLoad();

    const pipedModels: any[] = [];
    modelRedx.models.map(async (modelObj: Model, key: number) => {
      if (modelObj.file_name === "Soldier.glb") {
        pipedModels.push({
          ...(await soliderLoad(modelObj)),
          y_diff: modelObj.y_diff || 0,
        });
      } else pipedModels.push(await modelObjLoad(modelObj));
    });

    //----------------------------------animate-----------------------------------
    const controls = getCameraControlls();
    const cameraController = getCameraController();
    const cannonDebugRenderer = new CannonDebugRenderer(scene, world);
    let delta: any;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      delta = Math.min(clock.getDelta(), 0.1);
      world.step(delta);
      cannonDebugRenderer.update();
      pipedModels.map((pipedModel) => {
        if (pipedModel.isSoldier) {
          pipedModel.mixer.update(delta);
          updateCamera(cameraController, pipedModel.body);
        }
        pipedModel.model.position.set(
          pipedModel.body.position.x as number,
          (pipedModel.body.position.y as number) +
            (pipedModel?.y_diff || 0) * (pipedModel?.dimensions?.y || 0),
          pipedModel.body.position.z as number
        );
        pipedModel.model.quaternion.set(
          pipedModel.body.quaternion.x as number,
          pipedModel.body.quaternion.y as number,
          pipedModel.body.quaternion.z as number,
          pipedModel.body.quaternion.w as number
        );
      });
      render();
    };
    animate();
  };

  const modelObjLoad = async (modelObj: Model) => {
    const gltf: any = await gltfLoad(
      "/assets/" + modelObj.type + "/" + modelObj.file_name
    );
    const model = gltf.scene.clone();
    const scale = modelObj.scale || 1;
    model.scale.set(scale, scale, scale);
    const threePos = cacluate3DPosFrom2DPos(modelObj.position);
    model.position.set(threePos.x, threePos.y, threePos.z);
    model.traverse(function (object: any) {
      if (object.isMesh) object.castShadow = true;
    });
    scene.add(model);

    // Get Bounding Box and set physics
    const { body, dimensions } = getBoundingPhysicsBody(model);

    return {
      model,
      body,
      dimensions,
      y_diff: modelObj.y_diff || 0,
    };
  };

  // const addToScene = async () => {
  //   axisHelper();
  //   lightLoad();
  //   planeLoad();
  //   const { wallBody } = wallLoad();
  //   const soldier = await soliderLoad("/assets/glb/Soldier.glb");
  //   const { cylinder, cube, sphere } = characherLoad();

  //   //----------------------------------animate-----------------------------------
  //   const controls = getCameraControlls();
  //   const cameraController = getCameraController();
  //   const cannonDebugRenderer = new CannonDebugRenderer(scene, world);
  //   let delta;
  //   let isDragging = false;

  //   const animate = () => {
  //     requestAnimationFrame(animate);
  //     controls.update();
  //     updateCamera(cameraController, soldier.body);
  //     delta = Math.min(clock.getDelta(), 0.1);
  //     world.step(delta);
  //     cannonDebugRenderer.update();
  //     soldier.mixer.update(delta);
  //     if (isDragging) {
  //       soldier.body.position.set(
  //         soldier.model.position.x,
  //         soldier.model.position.y,
  //         soldier.model.position.z
  //       );
  //       soldier.model.quaternion.set(
  //         soldier.model.quaternion.x,
  //         soldier.model.quaternion.y,
  //         soldier.model.quaternion.z,
  //         soldier.model.quaternion.w
  //       );
  //     } else {
  //       soldier.model.position.set(
  //         soldier.body.position.x as number,
  //         (soldier.body.position.y as number) - soldier.dimensions.y / 2,
  //         soldier.body.position.z as number
  //       );
  //       soldier.model.quaternion.set(
  //         soldier.body.quaternion.x as number,
  //         soldier.body.quaternion.y as number,
  //         soldier.body.quaternion.z as number,
  //         soldier.body.quaternion.w as number
  //       );
  //     }

  //     // Copy coordinates from Cannon to Three.js
  //     cylinder.cylMesh.position.set(
  //       cylinder.cylBody.position.x,
  //       cylinder.cylBody.position.y,
  //       cylinder.cylBody.position.z
  //     );
  //     cylinder.cylMesh.quaternion.set(
  //       cylinder.cylBody.quaternion.x,
  //       cylinder.cylBody.quaternion.y,
  //       cylinder.cylBody.quaternion.z,
  //       cylinder.cylBody.quaternion.w
  //     );
  //     cube.cubeMesh.position.set(
  //       cube.cubeBody.position.x,
  //       cube.cubeBody.position.y,
  //       cube.cubeBody.position.z
  //     );
  //     cube.cubeMesh.quaternion.set(
  //       cube.cubeBody.quaternion.x,
  //       cube.cubeBody.quaternion.y,
  //       cube.cubeBody.quaternion.z,
  //       cube.cubeBody.quaternion.w
  //     );
  //     sphere.sphereMesh.position.set(
  //       sphere.sphereBody.position.x,
  //       sphere.sphereBody.position.y,
  //       sphere.sphereBody.position.z
  //     );
  //     sphere.sphereMesh.quaternion.set(
  //       sphere.sphereBody.quaternion.x,
  //       sphere.sphereBody.quaternion.y,
  //       sphere.sphereBody.quaternion.z,
  //       sphere.sphereBody.quaternion.w
  //     );

  //     render();
  //   };

  //   animate();
  // };

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
    body.position.set(model.position.x, model.position.y, model.position.z);
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

  const soliderLoad = async (modelObj: Model) => {
    const gltf: any = await gltfLoad(
      "/assets/" + modelObj.type + "/" + modelObj.file_name
    );
    const model = gltf.scene;
    // model.scale.set(0.1, 0.1, 0.1);
    model.position.set(-10, 15, 0);
    const threePos = cacluate3DPosFrom2DPos(modelObj.position);
    model.position.set(threePos.x, threePos.y, threePos.z);

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
      const step = 10;
      if (keyCode === 87) {
        body.velocity.x = step;
        body.velocity.z = 0;
        body.quaternion.setFromAxisAngle(
          new CANNON.Vec3(0, 1, 0),
          -Math.PI / 2
        );
      } else if (keyCode === 83) {
        body.velocity.x = -step;
        body.velocity.z = 0;
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
      } else if (keyCode === 65) {
        body.velocity.z = -step;
        body.velocity.x = 0;
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);
      } else if (keyCode === 68) {
        body.velocity.z = step;
        body.velocity.x = 0;
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);
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
      isSoldier: true,
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
    const cylGeometry = new THREE.CylinderGeometry(7, 5, 3, 5);
    const cylMesh = new THREE.Mesh(cylGeometry, normalMaterial);
    cylMesh.position.x = -3;
    cylMesh.position.y = 7;
    cylMesh.castShadow = true;
    scene.add(cylMesh);

    const physMat = new CANNON.Material();
    const cylBody = new CANNON.Body({
      mass: 1000,
      shape: new CANNON.Cylinder(7, 5, 3, 5),
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

  return <canvas ref={ref} />;
};

const Scene = () => {
  const modelRedx = useSelector((state: any) => state.model);
  const [controlEvent, setControlEvent] = useState<ModelControl>({
    show_model: true,
    show_skt: false,
    activate_all: true,
    continue_model: true,
    single_step: {
      enabled: false,
      event: false,
      size_of_next: 0.05,
    },
  });
  const dispatch = useDispatch();
  const onSelectedModel = (uuid: string) => {
    dispatch({
      type: SELECT_MODEL,
      payload: {
        selected: uuid,
      },
    });
  };

  const onPointerMissed = (event: any) => {
    dispatch({
      type: DESELECT_MODEL,
    });
  };

  const updateModel = (model: Model) => {
    dispatch({
      type: UPDATE_MODEL,
      payload: {
        model,
      },
    });
  };

  return (
    <Droppable droppableId="CANVAS">
      {(provided) => (
        <div
          className="canvas-container"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <CanvasScene modelRedx={modelRedx} />
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default Scene;
