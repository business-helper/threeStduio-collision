import { IJsonModel } from "flexlayout-react";

export const configLayout: IJsonModel = {
  global: {},
  borders: [],
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset",
        weight: 70,
        children: [
          {
            type: "tab",
            name: "Scene Renderer",
            component: "scene-renderer",
          },
        ],
      },
      {
        type: "row",
        weight: 30,
        children: [
          {
            type: "tabset",
            weight: 50,
            children: [
              {
                type: "tab",
                name: "Assets",
                component: "assets-panel",
              },
            ],
          },
          {
            type: "tabset",
            weight: 50,
            children: [
              {
                type: "tab",
                name: "Editor",
                component: "editor-panel",
              },
              {
                type: "tab",
                name: "Controls",
                component: "control-panel",
              },
            ],
          },
        ],
      },
    ],
  },
};
