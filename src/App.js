/**
 * Interactive Flow Diagram Application
 * 
 * This application implements a collaborative flow diagram editor using React Flow
 * and Velt CRDT for real-time collaboration. Users can create nodes, draw connections,
 * and dynamically add new nodes by dropping connections onto the canvas.
 */

import React, { useRef, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { veltStore } from '@velt/crdt-reactflow';
import { useShallow } from 'zustand/react/shallow';

/**
 * Zustand state selector for flow diagram state
 * Extracts necessary state and methods for managing nodes and edges
 */
const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
});


// Initial diagram state
const initialNodes = [
  {
    id: '0',
    type: 'input',
    data: { label: 'Node' },
    position: { x: 0, y: 50 },
  },
];
const initialEdges = [];

// Generate a random user ID for collaboration
const randomUserId = Math.floor(Math.random() * (100 - 1 + 1)) + 1;

// Node ID generation
let nodeIdCounter = Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
const getId = () => `${nodeIdCounter++}`;

// Default node origin point for positioning
const nodeOrigin = [0.5, 0];

/**
 * Main Flow Diagram Component
 * 
 * Features:
 * - Real-time collaboration using Velt CRDT
 * - Dynamic node creation on edge drops
 * - Interactive node and edge manipulation
 * - Automatic connection handling
 */
const AddNodeOnEdgeDrop = () => {
  const userId = 'user' + randomUserId;

  // Initialize Velt store for collaborative state management
  const storeRef = useRef(veltStore(initialNodes, initialEdges, userId, { debounceMs: 500 }));
  
  // Extract state and methods from the store using shallow comparison
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges } = storeRef.current(
    useShallow(selector),
  );

  // Reference to the flow diagram wrapper for positioning calculations
  const reactFlowWrapper = useRef(null);

  // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  // const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  // const onConnect = useCallback(
  //   (params) => setEdges((eds) => addEdge(params, eds)),
  //   [],
  // );

  /**
   * Handles the end of a connection attempt
   * If the connection is dropped on the canvas (invalid connection),
   * creates a new node at that position and connects it
   */
  const onConnectEnd = useCallback(
    (event, connectionState) => {
      if (!connectionState.isValid) {
        const id = getId();
        
        // Handle both mouse and touch events
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;
        
        // Create new node at the drop position
        const newNode = {
          id,
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          data: { label: `Node ${id}` },
          origin: nodeOrigin,
        };

        // Create edge connecting the source node to the new node
        const newEdge = {
          id: `e${id}`,
          source: connectionState.fromNode.id,
          target: id,
        };

        // Batch the node and edge changes together
        onNodesChange([{ type: 'add', item: newNode }]);
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
      <MiniMap />
      <Controls />
    </ReactFlow>
    </div>
  );
};

export default () => (
  <ReactFlowProvider>
    <AddNodeOnEdgeDrop />
  </ReactFlowProvider>
);
