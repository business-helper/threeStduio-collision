import React, { Fragment } from "react";
import styled from "styled-components";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { GLTF as MOCK_GLTF } from "../../provider/mock";
import { GLB as MOCK_GLB } from "../../provider/mock";
import { OBJ as MOCK_OBJ } from "../../provider/mock";
import DeleteIcon from "@mui/icons-material/Delete";
import cubeIcon from "./../../assets/icons/cube-1.png";

interface DraggingProps {
  isDragging?: boolean;
}

const Item = styled.div<DraggingProps>`
  display: flex;
  user-select: none;
  padding: 0.5rem;
  margin: 0 0 0.5rem 0;
  flex-direction: column;
  align-items: center;
  line-height: 1.5;
  border-radius: 3px;
  background: #fff;
  border: 1px
    ${(props: any) => (props.isDragging ? "dashed #4099ff" : "solid #ddd")};
  grid-column-end: span 1;
  grid-row-end: span 1;
  min-width: 100px;
`;

const ItemText = styled.div`
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const List = styled.div`
  padding: 0.5rem 0.5rem 0;
  font-family: sans-serif;
`;

const Kiosk = styled(List)`
  position: absolute;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
`;

const MyIcon = styled.img`
  width: 60px;
  object-fit: cover;
  height: auto;
  -webkit-box-flex: 1;
  flex-grow: 1;
`;

MyIcon.defaultProps = {
  src: cubeIcon,
};

const AssetsPanel = (props: any) => {
  const gltfs = MOCK_GLTF.files;
  const objs = MOCK_OBJ.files;
  const glbs = MOCK_GLB.files;
  const mergedFiles = [...gltfs, ...glbs, ...objs];

  const getStyle = (style: any, snapshot: any) => {
    if (!snapshot.isDragging) return {};
    if (!snapshot.isDropAnimating) {
      return style;
    }

    return {
      ...style,
      // cannot be 0, but make it super tiny
      transitionDuration: `0.001s`,
    };
  };

  return (
    <Droppable
      droppableId="ITEMS"
      isDropDisabled={true}
      isCombineEnabled={false}
    >
      {(provided, snapshot) => (
        <Kiosk ref={provided.innerRef} {...provided.droppableProps}>
          {mergedFiles.map((item: any, index: number) => (
            <Draggable draggableId={item.id} index={index} key={item.id}>
              {(provided, snapshot) => (
                <Fragment>
                  <Item
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    isDragging={snapshot.isDragging}
                    style={getStyle(provided.draggableProps.style, snapshot)}
                  >
                    <MyIcon />
                    <ItemText>{item.name}</ItemText>
                  </Item>
                  {snapshot.isDragging && (
                    <>
                      <Item>
                        <MyIcon />
                        <ItemText>{item.name}</ItemText>
                      </Item>
                    </>
                  )}
                </Fragment>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </Kiosk>
      )}
    </Droppable>
  );
};

export default AssetsPanel;
