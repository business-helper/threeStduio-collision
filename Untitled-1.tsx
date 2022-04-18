    // world.broadphase = new CANNON.NaiveBroadphase();
    // (world.solver as CANNON.GSSolver).iterations = 10;
    // world.allowSleep = true;

    // // physics material
    // const groundMaterial = new CANNON.Material("groundMaterial");
    // const wallMaterial = new CANNON.Material("wallMaterial");
    // const modelMaterial = new CANNON.Material("modelMaterial");
    // // contact b/w two material
    // const wallGroundContactMaterial = new CANNON.ContactMaterial(
    //   wallMaterial,
    //   groundMaterial,
    //   {
    //     friction: 8,
    //     restitution: 0.0,
    //   }
    // );
    // world.addContactMaterial(wallGroundContactMaterial);

    // const modelwallcontactMaterial = new CANNON.ContactMaterial(
    //   modelMaterial,
    //   wallMaterial,
    //   {
    //     friction: 0.1,
    //     restitution: 0,
    //   }
    // );
    // world.addContactMaterial(modelwallcontactMaterial);

    // // wall
    // const wallShape = new CANNON.Box(new CANNON.Vec3(15 / 2, 3 / 2, 0.5 / 2));
    // const wallBody = new CANNON.Body({
    //   mass: 0,
    //   shape: wallShape,
    //   material: wallMaterial,
    // });
    // wallBody.position.y = 3 / 2;
    // wallBody.position.z = -2;
    // world.addBody(wallBody);

    // // model
    // const modelShape = new CANNON.Box(new CANNON.Vec3(1 / 2, 2 / 2, 0.9 / 2));
    // const modelBody = new CANNON.Body({
    //   mass: 0,
    //   shape: modelShape,
    //   material: modelMaterial,
    // });
    // modelBody.position.y = 2 / 2;
    // modelBody.position.z = 2;
    // world.addBody(modelBody);