import { Observable, combineLatest, of } from "rxjs";
import { Node, NodeLayout, InputInfo, OutputInfo, IO } from './Node';
import { Edge, EdgeLayout } from './Edge';
import dagre = require('dagre');
import { switchMap, map } from "rxjs/operators";

export interface Layout {
    nodes: {
        [id: string]: NodeLayout
    },
    edges: {
        [id: string]: EdgeLayout
    }
}

const subnodeWidth =  50;
const subnodeHeight =  50;

export function getPropID(parentID: string, childName: string, io: IO): string {
    return `${parentID}.${io === IO.Input ? 'in' : 'out' }.${childName}`
}

export function getLayoutStream(nodesStream: Observable<Node[]>, edgesStream: Observable<Edge[]>): Observable<Layout> {
    const nodeGraph: dagre.graphlib.Graph = new dagre.graphlib.Graph({ multigraph: true, compound: true });

    nodeGraph.setGraph({ rankdir: 'LR' });
    nodeGraph.setDefaultEdgeLabel(() => ({}));
    const nodesAndIOSubnodes = nodesStream.pipe(
        switchMap((nodes: Node[]) => {
            return combineLatest(...nodes.map((node: Node) => {
                return combineLatest(of(node), node.getInputInfoStream(), node.getOutputInfoStream());
            }));
        }),
    )

    nodesAndIOSubnodes.subscribe((infos: [Node, InputInfo[], OutputInfo[]][]) => {
        const desiredNames = [];
        const existingNames = nodeGraph.nodes().map((nid: string) => nodeGraph.node(nid).id );

        infos.forEach(([node, inputs, outputs]: [Node, InputInfo[], OutputInfo[]]) => {
            const nodeID = node.getID();
            desiredNames.push(nodeID);

            if(!nodeGraph.hasNode(nodeID)) {
                nodeGraph.setNode(nodeID, { id: nodeID });
            }
            const inputs_outputs = [...inputs.map((i) => ({ io: i, isInput: IO.Input})), ...outputs.map((o) => ({ io: o, isInput: IO.Output })) ];

            inputs_outputs.forEach(({io, isInput}) => {
                const propID = getPropID(nodeID, io.name, isInput)
                desiredNames.push(propID);
                if(!nodeGraph.hasNode(propID)) {
                    nodeGraph.setNode(propID, { id: propID, propName: io.name, parentID: nodeID, isInput, width: subnodeWidth, height: subnodeHeight });
                    nodeGraph.setParent(propID, nodeID);
                }
            });
        });

        const namesThatShouldntBeThere = difference(existingNames, desiredNames);
        namesThatShouldntBeThere.forEach((prop) => {
            nodeGraph.removeNode(prop);
        })
    });

    edgesStream.subscribe((edges: Edge[]) => {
        const graphEdges = nodeGraph.edges();
        const desiredEdgeIDs = [];
        edges.forEach((e) => {
            const eid = e.getID();
            desiredEdgeIDs.push(eid);

            if(graphEdges.findIndex((ge) => ge.name === eid) < 0) {
                const from = e.getFrom();
                const to = e.getTo();
                const v = getPropID(from.node.getID(), from.prop, IO.Output);
                const w = getPropID(to.node.getID(), to.prop, IO.Input);
                nodeGraph.setEdge({ v, w, name: eid});
            }
        });
        graphEdges.forEach((edge, index) => {
            if(desiredEdgeIDs.indexOf(edge.name) < 0) {
                const edge = graphEdges[index];
                (nodeGraph.removeEdge as any)(edge.v, edge.w, edge.name);
            }
        });
    });
    
    const layoutStream = combineLatest(nodesStream, edgesStream).pipe(
        switchMap(([nodes]: [Node[], Edge[]]) => {
            return combineLatest(...nodes.map((node: Node) => {
                const ioInfoStream = combineLatest(of(node), node.getInputInfoStream(), node.getOutputInfoStream());
                return ioInfoStream;
            }));
        }),
        map(() => {
            const layout: Layout = {
                nodes: {},
                edges: {}
            };
            dagre.layout(nodeGraph);

            nodeGraph.nodes().forEach((nodeID) => {
                const parent = nodeGraph.parent(nodeID);
                if(parent === undefined) {
                    const node = nodeGraph.node(nodeID);
                    const { id } = node;
                    layout.nodes[id] = {
                        x: node.x,
                        y: node.y,
                        width: node.width,
                        height: node.height,
                        inputs: {},
                        outputs: {}
                    };
                }
            });
            nodeGraph.nodes().forEach((nodeID) => {
                const parent = nodeGraph.parent(nodeID);
                if(parent !== undefined) {
                    const node = nodeGraph.node(nodeID);
                    const { parentID, isInput, propName } = node;
                    const inoutname = isInput===IO.Input ? 'inputs' : 'outputs';
                    layout.nodes[parentID][inoutname][propName] = {
                        x: node.x,
                        y: node.y,
                        width: node.width,
                        height: node.height
                    };
                }
            });

            nodeGraph.edges().forEach((edgeID) => {
                const edge = nodeGraph.edge(edgeID);
                layout.edges[edgeID.name] = { points: edge.points };
            });
            return layout;
        }),
        // debounceTime(100)
    );
    return  layoutStream;
}

export function difference(arr1: any[], arr2: any[]): any[] {
    const diff = new Set(arr1);
    arr2.forEach((i) => { diff.delete(i) });
    return Array.from(diff);
}