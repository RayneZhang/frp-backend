import { Edge, Loc, EdgeLayout } from './Edge';
import { Node, ConstantNode, PROP_DEFAULT_NAME, InputInfo, OutputInfo, NodeLayout } from './Node';
import  { ops }  from './Ops';
import dagre = require('dagre');
import { combineLatest, BehaviorSubject, Subject, of, merge } from 'rxjs';
import { map, mergeMap, debounceTime, concatMap, switchMap } from 'rxjs/operators';
import update, { extend } from 'immutability-helper';
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
    private nodeGraph: dagre.graphlib.Graph = new dagre.graphlib.Graph({ multigraph: true, compound: true });
    private static MINIMUM_DIMENSIONS = { width: 50, height: 50}
    private static HEIGHT_PER_PROPERTY: number = 40;

    private nodesStream: BehaviorSubject<Node[]> = new BehaviorSubject([]);
    private edgesStream: BehaviorSubject<Edge[]> = new BehaviorSubject([]);

    public constructor() {
        this.nodeGraph.setGraph({ rankdir: 'LR' });
        this.nodeGraph.setDefaultEdgeLabel(() => ({}));

        this.establishLayoutStream();
    }

    private establishLayoutStream(): void {
        const upd = this.nodesStream.pipe(
            switchMap((nodes: Node[]) => {
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
                    const nodeObj = this.nodeGraph.node(nodeID);

                    if(!this.nodeGraph.hasNode(nodeID)) {
                        this.nodeGraph.setNode(nodeID, { id: nodeID });
                    }
                    layout.nodes[nodeID] = {x: -1, y: -1, width: -1, height: -1, inputs: {}, outputs: {}};
                    inputInfo.forEach((ii) => {
                        const { name } = ii;
                        const propID = Edge.getPropIDString(node, name, true)
                        layout.nodes[nodeID].inputs[name] = {name: name, x: -1, y: -1, width: -1, height: -1};
                        if(!this.nodeGraph.hasNode(propID)) {
                            this.nodeGraph.setNode(propID, { id: propID, propName: name, parentID: nodeID, isInput: true });
                            this.nodeGraph.setParent(propID,  nodeID);
                        }
                    });

                    outputInfo.forEach((oi) => {
                        const { name } = oi;
                        const propID = Edge.getPropIDString(node, name, false)
                        layout.nodes[nodeID].outputs[name] = {name: oi.name, x: -1, y: -1, width: -1, height: -1};
                        if(!this.nodeGraph.hasNode(propID)) {
                            this.nodeGraph.setNode(propID, { id: propID, propName: name, parentID: nodeID, isInput: false });
                            this.nodeGraph.setParent(propID,  nodeID);
                        }
                    });
                });

                nodes.forEach(([node, inputInfo, outputInfo, incomingEdges, outgoingEdges]: [Node, InputInfo[], OutputInfo[], Edge[], Edge[]]) => {
                    outgoingEdges.forEach((edge: Edge) => {
                        layout.edges[edge.getID()] = [];
                        const v = edge.getFromIDString();
                        const w = edge.getToIDString();
                        if(!this.nodeGraph.hasEdge({ v, w })) {
                            this.nodeGraph.setEdge({v, w}, { id: edge.getID() });
                        }
                    });
                });

                dagre.layout(this.nodeGraph);

                this.nodeGraph.nodes().forEach((nodeID) => {
                    const parent = this.nodeGraph.parent(nodeID);
                    const node = this.nodeGraph.node(nodeID);
                    const { id } = node;
                    if(parent === undefined) {
                        layout.nodes[id].x = node.x;
                        layout.nodes[id].y = node.y;
                        layout.nodes[id].width = node.width;
                        layout.nodes[id].height = node.height;
                    } else {
                        const { parentID, isInput, propName } = node;
                        const inoutname = isInput ? 'inputs' : 'outputs';
                        layout.nodes[parentID][inoutname][propName].x = node.x;
                        layout.nodes[parentID][inoutname][propName].y = node.y;
                        layout.nodes[parentID][inoutname][propName].width = node.width;
                        layout.nodes[parentID][inoutname][propName].height = node.height;
                    }
                });
                this.nodeGraph.edges().forEach((edgeID) => {
                    const edge = this.nodeGraph.edge(edgeID);

                    layout.edges[edge.id] = edge.points;
                });

                return layout;
            }),
            debounceTime(100)
        );

        upd.subscribe((layout: Layout) => {
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
        const nodeID = node.getIDString();
        // const whInfo = { width: Scene.MINIMUM_DIMENSIONS.width, height: Scene.MINIMUM_DIMENSIONS.height };
        // this.nodeGraph.setNode(nodeID, { id: nodeID });

        const nodesValue = this.nodesStream.getValue();
        const newNodes = update(nodesValue, {$push: [node]});
        this.nodesStream.next(newNodes);
    }


    public addEdge(from: Loc|Node, to: Loc|Node): Edge {
        if (from instanceof Node) { from = { node: from, prop: PROP_DEFAULT_NAME }; }
        if   (to instanceof Node) { to   = { node: to, prop: PROP_DEFAULT_NAME }; }

        const edge = new Edge(from, to);

        this.edges.set(edge.getID(), edge);

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