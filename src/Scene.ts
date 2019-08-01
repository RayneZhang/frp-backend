import { Edge, Loc, EdgeLayout } from './Edge';
import { Node, ConstantNode, PROP_DEFAULT_NAME, InputInfo, OutputInfo, NodeLayout } from './Node';
import  { ops }  from './Ops';
import dagre = require('dagre');
import { combineLatest, BehaviorSubject, Subject, of, merge } from 'rxjs';
import { map, mergeMap, debounceTime } from 'rxjs/operators';
import update from 'immutability-helper';
import { each } from 'lodash';

export interface Layout {
    nodes: {
        [id: string]: NodeLayout
    },
    edges: {
        [id: string]: EdgeLayout
    }
}

export class Scene {
    private nodes: Map<string, Node> = new Map();
    private edges: Map<string, Edge> = new Map();
    private nodeGraph: dagre.graphlib.Graph = new dagre.graphlib.Graph();
    private edgeGraph: dagre.graphlib.Graph = new dagre.graphlib.Graph();
    private static MINIMUM_DIMENSIONS = { width: 50, height: 50}
    private static HEIGHT_PER_PROPERTY: number = 40;

    private nodesStream: BehaviorSubject<Node[]> = new BehaviorSubject([]);
    private edgesStream: BehaviorSubject<Edge[]> = new BehaviorSubject([]);

    public constructor() {
        this.nodeGraph.setGraph({ rankdir: 'LR' });
        this.nodeGraph.setDefaultEdgeLabel(() => ({}));
        this.edgeGraph.setGraph({ rankdir: 'LR' });
        this.edgeGraph.setDefaultEdgeLabel(() => ({}));

        this.establishLayoutStream();
    }

    private establishLayoutStream(): void {
        const upd = this.nodesStream.pipe(
            mergeMap((nodes: Node[]) => {
                return combineLatest(...nodes.map((node: Node) => {
                    const ioInfoStream = combineLatest(of(node), node.getInputInfoStream(), node.getOutputInfoStream(),
                            node.getIncomingEdgesStream(), node.getOutgoingEdgesStream());
                    return ioInfoStream;
                }));
            }),
            map((nodes: [Node, InputInfo[], OutputInfo[], Edge[], Edge[]][]) => {
                    const layout: Layout = {
                        nodes: {},
                        edges: {}
                    };

                    nodes.forEach(([node, inputInfo, outputInfo, incomingEdges, outgoingEdges]: [Node, InputInfo[], OutputInfo[], Edge[], Edge[]]) => {
                        const nodeID = node.getIDString();
                        const { width, height } = Scene.computeNodeDimensions(inputInfo, outputInfo);

                        const nodeObj = this.nodeGraph.node(nodeID);
                        nodeObj.width = width;
                        nodeObj.height = height;
                    });

                    dagre.layout(this.nodeGraph);

                    this.nodeGraph.nodes().forEach((nodeID) => {
                        const node = this.nodeGraph.node(nodeID);
                        layout.nodes[nodeID] = update(node, { inputs: {$set: {}}, outputs: {$set: {}}}) as any;
                    });

                    nodes.forEach(([node, inputInfo, outputInfo, incomingEdges, outgoingEdges]: [Node, InputInfo[], OutputInfo[], Edge[], Edge[]]) => {
                        const nodeID = node.getIDString();
                        const nodeObj = this.nodeGraph.node(nodeID);

                        const leftEdgeX: number = nodeObj.x;
                        const rightEdgeX: number = leftEdgeX + nodeObj.width;
                        const startY: number = nodeObj.y + Scene.MINIMUM_DIMENSIONS.height / 2;
                        let x: number = leftEdgeX;
                        let y: number = startY;
                        inputInfo.forEach((ii: InputInfo) => {
                            const toID = Edge.getPropIDString(node, ii.name, true);
                            if(this.edgeGraph.hasNode(toID)) {
                                const toIDEdgeObj = this.edgeGraph.node(toID);
                                toIDEdgeObj.x = x;
                                toIDEdgeObj.y = y;
                            }
                            layout.nodes[nodeID].inputs[ii.name] = {x, y};

                            y += Scene.HEIGHT_PER_PROPERTY;
                        });
                        x = rightEdgeX;
                        y = startY;
                        outputInfo.forEach((oi: OutputInfo) => {
                            const fromID = Edge.getPropIDString(node, oi.name, false);
                            if(this.edgeGraph.hasNode(fromID)) {
                                console.log('HAS');
                                const fromIDEdgeObj = this.edgeGraph.node(fromID);
                                fromIDEdgeObj.x = x;
                                fromIDEdgeObj.y = y;
                            }
                            layout.nodes[nodeID].outputs[oi.name] = {x, y};

                            y += Scene.HEIGHT_PER_PROPERTY;
                        });
                    });
                    this.edgeGraph.nodes().forEach((id: string) => {
                        const n = this.edgeGraph.node(id);
                        console.log(id);
                        console.log(n);
                    });

                    dagre.layout(this.edgeGraph);
                    this.edgeGraph.edges().forEach((e: dagre.Edge) => {
                        const edge = this.edgeGraph.edge(e);
                        const { id, points } = edge;

                        layout.edges[id] = points;
                    });

                    return layout;
                }
            ),
            debounceTime(100)
        );

        upd.subscribe((layout: Layout) => {
            console.log(JSON.stringify(layout, undefined, 2));
            each(layout.nodes, (nodeLayout: NodeLayout, id: string) => {
                const node = this.nodes.get(id);
                node.setLayout(nodeLayout);
            });
            each(layout.edges, (edgeLayout: EdgeLayout, id: string) => {
                const edge = this.edges.get(id);
                edge.setLayout(edgeLayout);
            });
        });
    }

    private static computeNodeDimensions(inputInfo: InputInfo[], outputInfo: OutputInfo[]): {width: number, height: number} {
        return {
            width: Scene.MINIMUM_DIMENSIONS.width,
            height: Scene.MINIMUM_DIMENSIONS.height + Scene.HEIGHT_PER_PROPERTY * Math.max(inputInfo.length, outputInfo.length),
        };
    }

    public addConstant(value: any): Node {
        const node = new ConstantNode(value);
        this.addNode(node);
        return node;
    }

    public addOp(name: string): Node {
        const opFn = ops[name];
        const op = opFn();
        this.addNode(op);
        return op;
    }

    private addNode(node: Node): void {
        this.nodes.set(node.getIDString(), node);
        const whInfo = { width: Scene.MINIMUM_DIMENSIONS.width, height: Scene.MINIMUM_DIMENSIONS.height };
        this.nodeGraph.setNode(node.getIDString(), whInfo);

        const nodesValue = this.nodesStream.getValue();
        const newNodes = update(nodesValue, {$push: [node]});
        this.nodesStream.next(newNodes);
    }


    public addEdge(from: Loc|Node, to: Loc|Node): Edge {
        if (from instanceof Node) { from = { node: from, prop: PROP_DEFAULT_NAME }; }
        if   (to instanceof Node) { to   = { node: to, prop: PROP_DEFAULT_NAME }; }

        const edge = new Edge(from, to);

        this.edges.set(edge.getID(), edge);

        this.nodeGraph.setEdge(from.node.getIDString(), to.node.getIDString(), { id: edge.getID() });

        const fromPropID = edge.getFromIDString();
        const toPropID = edge.getToIDString();
        if(!this.edgeGraph.hasNode(fromPropID)) {
            this.edgeGraph.setNode(fromPropID, {width:1, height: 1});
        }
        if(!this.edgeGraph.hasNode(toPropID)) {
            this.edgeGraph.setNode(toPropID, {width: 1, height: 1});
        }
        this.edgeGraph.setEdge(fromPropID, toPropID, { id: edge.getID() });

        from.node.addOutgoingEdge(edge);
        to.node.addIncomingEdge(edge);

        const edgesValue = this.edgesStream.getValue();
        const newEdges = update(edgesValue, {$push: [edge]});
        this.edgesStream.next(newEdges);

        return edge;
    }

    public removeEdge(edge: Edge): void {
        const from = edge.getFrom();
        const to = edge.getTo();
        from.node.removeOutgoingEdge(edge);
        to.node.removeIncomingEdge(edge);

        const edgesValue = this.edgesStream.getValue();
        const index = edgesValue.indexOf(edge);
        if(index >= 0) {
            const newEdges = update(edgesValue, {$splice: [[index, 1]]});
            this.edgesStream.next(newEdges);
        }
    }

    public removeNode(node: Node): void {
        this.nodeGraph.removeNode(node.getIDString());
        const nodesValue = this.nodesStream.getValue();
        const index = nodesValue.indexOf(node);
        if(index >= 0) {
            const newNodes = update(nodesValue, {$splice: [[index, 1]]});
            this.nodesStream.next(newNodes);
        }
    }
}