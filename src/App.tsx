import React, { useState } from "react";
import { Layout, Model, TabNode } from "flexlayout-react";
import "flexlayout-react/style/light.css";
import { DragDropContext } from "react-beautiful-dnd";
import { useDispatch } from "react-redux";

import "./App.css";
import { Scene } from "./components/scene-renderer";
import { configLayout } from "./provider/config";
import { GLTF as MOCK_GLTF } from "./provider/mock";
import { GLB as MOCK_GLB } from "./provider/mock";
import { OBJ as MOCK_OBJ } from "./provider/mock";
import { AssetsPanel } from "./components/assets-panel";
import { ADD_MODEL } from "./store/actions";

const model = Model.fromJson(configLayout);

function App() {
  const [event, setEvent] = useState<any>();
  const dispatch = useDispatch();

  const gltfs = MOCK_GLTF.files;
  const glbs = MOCK_GLB.files;
  const objs = MOCK_OBJ.files;

  const factory = (node: TabNode) => {
    switch (node.getComponent()) {
      case "scene-renderer":
        return <Scene />;
      case "assets-panel":
        return <AssetsPanel />;
      case "editor-panel":
      // return <EditorPanel />;
      case "control-panel":
      // return <ControlPanel />;
      default:
        break;
    }
  };

  const handleOnMouseUp = (e: any) => {
    setEvent(e);
  };

  const onDragStart = () => {
    document.addEventListener("mouseup", handleOnMouseUp);
  };

  const onDragEnd = (result: any) => {
    if (result.destination?.droppableId === "CANVAS") {
      const selValue: any = [...gltfs, ...glbs, ...objs].find((file) => {
        return file.id === result.draggableId;
      });
      if (selValue) {
        const ext = selValue?.name.split(".").pop();
        dispatch({
          type: ADD_MODEL,
          payload: {
            file_name: selValue?.name,
            type: ext,
            position: {
              x: event?.offsetX,
              y: event?.offsetY,
            },
          },
        });
      }
    }
    setTimeout(() => {
      document.removeEventListener("mouseup", handleOnMouseUp);
    }, 10);
  };

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <Layout model={model} factory={factory} />
    </DragDropContext>
  );
}

export default App;
