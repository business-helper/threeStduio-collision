import { v4 as uuid } from "uuid";

export const GLTF = {
  files: [
    {
      id: uuid(),
      name: "AlphaBlendModeTest.gltf",
    },
    {
      id: uuid(),
      name: "Box.gltf",
    },
    {
      id: uuid(),
      name: "Buggy.gltf",
    },
    {
      id: uuid(),
      name: "Poimandres.gltf",
    },
  ],
};

export const GLB = {
  files: [
    {
      id: uuid(),
      name: "Cat.glb",
      use_jsx: true,
    },
    {
      id: uuid(),
      name: "Soldier.glb",
      use_jsx: true,
    },
  ],
};

export const OBJ = {
  files: [
    {
      id: uuid(),
      name: "Poimandres.obj",
    },
  ],
};
