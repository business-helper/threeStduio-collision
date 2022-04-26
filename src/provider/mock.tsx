import { v4 as uuid } from "uuid";

export const GLTF = {
  files: [
    {
      id: uuid(),
      name: "AlphaBlendModeTest.gltf",
      yDiff: -0.5,
    },
    {
      id: uuid(),
      name: "Box.gltf",
    },
    {
      id: uuid(),
      name: "Buggy.gltf",
      scale: 0.02,
      yDiff: -0.45,
    },
    {
      id: uuid(),
      name: "Poimandres.gltf",
      yDiff: -0.5,
    },
  ],
};

export const GLB = {
  files: [
    {
      id: uuid(),
      name: "Cat.glb",
      scale: 0.1,
      yDiff: -0.5,
    },
    {
      id: uuid(),
      name: "Soldier.glb",
      can_be_character: true,
      yDiff: -0.5,
    },
  ],
};

export const OBJ = {
  files: [],
};
