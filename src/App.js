import React, { useRef, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { veltStore } from '@velt/crdt-reactflow';
import { useShallow } from 'zustand/react/shallow';

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
});


const initialNodes = [
  {
    id: '0',
    type: 'input',
    data: { label: 'Node' },
    position: { x: 0, y: 50 },
  },
];
const initialEdges = [];
const randomnumber = Math.floor(Math.random() * (100 - 1 + 1)) + 1;

let id = 9;
const getId = () => `${id++}`;
const nodeOrigin = [0.5, 0];

const AddNodeOnEdgeDrop = () => {

  const userId = 'user' + randomnumber;

  const storeRef = useRef(veltStore(initialNodes, initialEdges, userId));
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges } = storeRef.current(
    useShallow(selector),
  );

  const reactFlowWrapper = useRef(null);

  // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  // const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  // const onConnect = useCallback(
  //   (params) => setEdges((eds) => addEdge(params, eds)),
  //   [],
  // );

  const onConnectEnd = useCallback(
    (event, connectionState) => {
      // when a connection is dropped on the pane it's not valid
      if (!connectionState.isValid) {
        // we need to remove the wrapper bounds, in order to get the correct position
        const id = getId();
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;
        const newNode = {
          id,
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          data: { label: `Node ${id}` },
          origin: [0.5, 0.0],
        };

        // Update nodes using onNodesChange
        onNodesChange([{ type: 'add', item: newNode }]);

        // Update edges using onEdgesChange
        const newEdge = {
          id,
          source: connectionState.fromNode.id,
          target: id,
        };
        onEdgesChange([{ type: 'add', item: newEdge }]);
      }
    },
    [screenToFlowPosition, onNodesChange, onEdgesChange],
  );

  return (
    <div className="wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        style={{ backgroundColor: "#F7F9FB" }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        fitView
        fitViewOptions={{ padding: 2 }}
        nodeOrigin={nodeOrigin}
    >
      <Background  />
    </ReactFlow>
    </div>
  );
};

export default () => (
  <ReactFlowProvider>
    <AddNodeOnEdgeDrop />
  </ReactFlowProvider>
);
