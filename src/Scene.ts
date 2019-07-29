import { Edge, Loc } from './Edge';
import { Node, ConstantNode, OpNode, PROP_DEFAULT_NAME } from './Node';
import  { ops }  from './Ops';
import { from } from 'rxjs';
export class Scene {
    private nodes: Set<Node<any, any>> = new Set();

    public addConstant(value: any): Node<null, any> {
        const node = new ConstantNode<any>(value);
        this.addNode(node);
        return node;
    }

    public addOp(name: string): Node<any, any> {
        const opFn = ops[name];
        const op = opFn();
        this.addNode(op);
        return op;
    }

    private addNode(node: Node<any, any>): void {
        this.nodes.add(node);
    }
    public addEdge(from: Loc|Node<any, any>, to: Loc|Node<any, any>): Edge {
        if(from instanceof Node) {
            from = { node: from, prop: PROP_DEFAULT_NAME };
        }
        if(to instanceof Node) {
            to = { node: to, prop: PROP_DEFAULT_NAME };
        }
        const edge = new Edge(from, to);
        from.node.addOutgoingEdge(edge);
        to.node.addIncomingEdge(edge);
        return edge;
    }

    public removeEdge(edge: Edge): void {
        const from = edge.getFrom();
        const to = edge.getTo();
        from.node.removeOutgoingEdge(edge);
        to.node.removeIncomingEdge(edge);
    }

    public removeNode(node: Node<any, any>): void {
        this.nodes.delete(node);
    }
}