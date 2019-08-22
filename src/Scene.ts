import { Edge, Loc } from './Edge';
import { Node, ConstantNode, PROP_DEFAULT_NAME, InputInfo, ObjNode, OpNode } from './Node';
import  { ops }  from './Ops';
import { combineLatest, BehaviorSubject, Observable } from 'rxjs';
import update from 'immutability-helper';
import { getLayoutStream, Layout } from './SceneLayout';

/**
 * A scene represents a complete program
 */
export class Scene {
    private nodesStream: BehaviorSubject<Node[]> = new BehaviorSubject([]); // A stream of lists of nodes
    private edgesStream: BehaviorSubject<Edge[]> = new BehaviorSubject([]); // A stream of lists of edges

    private layoutStream: Observable<Layout> = getLayoutStream(this.getNodesStream(), this.getEdgesStream()); // A stream with the layout (where to position objects)

    public constructor() {
        // A subscription to update individual nodes/edges' layouts from a single layout object
        combineLatest(this.layoutStream, this.getNodesStream(), this.getEdgesStream()).subscribe(
            ([layout, nodes, edges]: [Layout, Node[], Edge[]]) => {
                // Go through all of the nodes and update their layouts
                nodes.forEach((node) => {
                    const id = node.getID();
                    if(layout.nodes[id]) {
                        node._setLayout(layout.nodes[id]);
                    }
                });
                // Go through all the edges and update their layouts
                edges.forEach((edge) => {
                    const id = edge.getID();
                    if(layout.edges[id]) {
                        edge.setLayout(layout.edges[id]);
                    }
                });
            }
        );
    }

    /**
     * Add a constant value to the scene
     * @param value The constant value to add
     */
    public addConstant(value: any): Node {
        const node = new ConstantNode(value);
        return this.addNode(node);
    }

    /**
     * Add an operation to the scene
     * @param name The name of the op (a key in Op.ts)
     */
    public addOp(name: string): OpNode {
        const opFn = ops[name];
        const op = opFn();
        this.addNode(op);
        return op;
    }

    /**
     * Add an object to the scene
     * @param name The human-readable label of the object
     * @param inputs The input infos with default values
     */
    public addObj(name: string, inputs: InputInfo[]): ObjNode {
        const obj = new ObjNode(name, inputs);
        this.addNode(obj);
        return obj;
    }

    // Add any node to the scene
    private addNode(node: Node): Node {
        const nodesValue = this.nodesStream.getValue();
        const newNodes = update(nodesValue, {$push: [node]}); // Add the node to the list of nodes (without mutating)
        this.nodesStream.next(newNodes); // Update my list of ndoes
        return node;
    }

    /**
     * Add a new edge between node properties
     * 
     * @param from {node: Node, prop: string}: Where this edge leaves from
     * @param to {node: Node, prop: string}: Where this edge goes to
     */
    public addEdge(from: Loc|Node, to: Loc|Node): Edge {
        // If only the Node is supplied, we use the default prop name
        if (from instanceof Node) { from = { node: from, prop: PROP_DEFAULT_NAME }; }
        if   (to instanceof Node) { to   = { node: to, prop: PROP_DEFAULT_NAME }; }

        const edge = new Edge(from, to);
        from.node.addOutgoingEdge(edge);
        to.node.addIncomingEdge(edge);

        const edgesValue = this.edgesStream.getValue();
        const newEdges = update(edgesValue, {$push: [edge]}); // Add the edge to the list (with no mutations)
        this.edgesStream.next(newEdges);

        return edge;
    }

    /**
     *  Remove an edge from the scene
     * @param edge The edge to remove
     */
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

            edge.remove();
        }
    }

    /**
     * Remove a node from the scene
     * @param node The Node to remove
     */
    public removeNode(node: Node): void {
        const nodesValue = this.nodesStream.getValue();
        const index = nodesValue.indexOf(node);
        if(index >= 0) {
            //We need to remove any edges that involve this node, so we'll see which ones we need to remove...
            const edgesValue = this.edgesStream.getValue();
            const toRemoveEdges = edgesValue.filter((e: Edge) => ((e.getFrom().node === node) || (e.getTo().node === node)));

            if(toRemoveEdges.length > 0) { // if we have any edges to remove...
                toRemoveEdges.forEach((edge) => {
                    const from = edge.getFrom();
                    const to = edge.getTo();
                    from.node.removeOutgoingEdge(edge);
                    to.node.removeIncomingEdge(edge);

                    edge.remove()
                });
                this.edgesStream.next(edgesValue.filter((e) => toRemoveEdges.indexOf(e) < 0));
            }

            // Finally, remove the node
            const newNodes = update(nodesValue, {$splice: [[index, 1]]});
            this.nodesStream.next(newNodes);
            node.remove();
        }
    }

    /**
     * Get a stream whose values are the current nodes in the scene
     */
    public getNodesStream(): Observable<Node[]> { return this.nodesStream; }
    /**
     * Get a stream whose values are the current edges in the scene
     */
    public getEdgesStream(): Observable<Edge[]> { return this.edgesStream; }

    /**
     * Returns a node based on the given node id
     * @param nodeID The node's unique ID
     */
    public getNode(nodeID: string): Node { 
        const nodesValue: Node[] = this.nodesStream.getValue();
        // Go through all of the nodes and compare their IDs
        for (let i = 0; i < nodesValue.length; i++) {
            if (nodeID === nodesValue[i].getID()) return nodesValue[i];
        }
        // Return null if there is no node ID match
        return null;
     } 

     /**
     * Returns an edge based on the given edge id
     * @param edgeID The edge's unique ID
     */
    public getEdge(edgeID: string): Edge { 
        const edgesValue: Edge[] = this.edgesStream.getValue();
        // Go through all of the nodes and compare their IDs
        for (let i = 0; i < edgesValue.length; i++) {
            if (edgeID === edgesValue[i].getID()) return edgesValue[i];
        }
        // Return null if there is no edge ID match
        return null;
     } 
}