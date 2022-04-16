import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as CANNON from "cannon-es";

const Scene = () => {
  const canvasRef = useRef<any>();
  const [renderer, setRenderer] = useState<any>(null);
  const [camera, setCamera] = useState<any>(null);
  const [scene] = useState(new THREE.Scene());
  const [world] = useState(new CANNON.World());

  const handleResize = () => {
    renderer?.setSize(window.innerWidth, window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
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

  useEffect(() => {
    if (!renderer || !camera) return;
    handleResize();

    configRenderer();
    setCameraPos();
    addToScene();

    var animate = function () {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
  }, [renderer, camera]);

  const configRenderer = () => {
    renderer.shadowMap.enabled = true;
  };
  const setCameraPos = () => {
    camera.position.set(0, 2, 4);
  };

  const addToScene = () => {
    scene.add(new THREE.AxesHelper(5));

    const light1 = new THREE.SpotLight();
    light1.position.set(2.5, 5, 5);
    light1.angle = Math.PI / 4;
    light1.penumbra = 0.5;
    light1.castShadow = true;
    light1.shadow.mapSize.width = 1024;
    light1.shadow.mapSize.height = 1024;
    light1.shadow.camera.near = 0.5;
    light1.shadow.camera.far = 20;
    scene.add(light1);

    const light2 = new THREE.SpotLight();
    light2.position.set(-2.5, 5, 5);
    light2.angle = Math.PI / 4;
    light2.penumbra = 0.5;
    light2.castShadow = true;
    light2.shadow.mapSize.width = 1024;
    light2.shadow.mapSize.height = 1024;
    light2.shadow.camera.near = 0.5;
    light2.shadow.camera.far = 20;
    scene.add(light2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.y = 0.5;

    world.gravity.set(0, -9.82, 0);
    // world.broadphase = new CANNON.NaiveBroadphase();
    // (world.solver as CANNON.GSSolver).iterations = 10;
    // world.allowSleep = true;

    const normalMaterial = new THREE.MeshNormalMaterial();
    const phongMaterial = new THREE.MeshPhongMaterial();

    // Floor
    const planeGeometry = new THREE.PlaneGeometry(25, 25);
    const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
    planeMesh.rotateX(-Math.PI / 2);
    planeMesh.receiveShadow = true;
    scene.add(planeMesh);

    const planeBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
    });
    planeBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    world.addBody(planeBody);

    // Cube
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMesh = new THREE.Mesh(cubeGeometry, normalMaterial);
    cubeMesh.position.x = -3;
    cubeMesh.position.y = 3;
    cubeMesh.castShadow = true;
    scene.add(cubeMesh);

    const cubeBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
    });
    cubeBody.position.set(
      cubeMesh.position.x,
      cubeMesh.position.y,
      cubeMesh.position.z
    );
    world.addBody(cubeBody);

    // Sphere
    const sphereGeometry = new THREE.SphereGeometry();
    const sphereMesh = new THREE.Mesh(sphereGeometry, normalMaterial);
    sphereMesh.position.x = -1;
    sphereMesh.position.y = 3;
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
    icosahedronMesh.position.x = -1.2;
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

    function animate() {
      requestAnimationFrame(animate);

      controls.update();

      //delta = clock.getDelta()
      delta = Math.min(clock.getDelta(), 0.1);
      world.step(delta);

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
      renderer.render(scene, camera);
    }

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
