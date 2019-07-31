import { Node } from './Node';
import { Observable, ReplaySubject, Subject, BehaviorSubject } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

export interface Loc {
    node: Node,
    prop: string,
}

export type EdgeLayout = {x: number, y: number}[];

/**
 * An Edge instance represents directed data flow between two node properties.
 * Every Edge instance keeps track of its current value (through valueStream)
 */
export class Edge {
    private static edgeCount: number = 1;
    private layout: Subject<EdgeLayout> = new BehaviorSubject([]);

    private id: number;

    // A stream that tracks which location this edge originates from
    // fromStream is a stream where every item is a Loc instance. every time
    // this edge's `from` property is changed, a new Loc gets pushed onto the end
    // of fromStream
    private fromStream: Subject<Loc> = new ReplaySubject<Loc>();

    // A stream that tracks the *current value* of this edge (which depends on where it originates from)
    // it does this by:
    //     1) converting every item in fromStream into a stream of that node's current values (the first map call)
    //     2) "flattening" (through switchMap) each of those streams to produce one stream of current values
    private valueStream: Observable<any> = this.fromStream.pipe(map((from: Loc): Observable<any> => {
        const { node, prop } = from;
        return node.pluckOutput(prop);
    }), switchMap((stream: Observable<any>): Observable<any> => {
        return stream;
    }));

    constructor(private f: Loc, private t: Loc) {
        this.setFrom(f);
        this.setTo(t);
        this.id = Edge.edgeCount++;
    }

    public getLayoutStream(): Observable<EdgeLayout> {
        return this.layout;
    }

    public setLayout(l: EdgeLayout): void {
        this.layout.next(l);
    }

    /**
     * Return the node and property that this edge originates from
     */
    public getFrom(): Loc { return this.f; }

    /**
     * Return the node and property that this edge goes to
     */
    public getTo(): Loc { return this.t; }

    /**
     * Change where this edge originates from
     * @param f - The new origin for this Edge
     */
    public setFrom(f: Loc): void {
        this.f = f;
        this.fromStream.next(f);
    }

    /**
     * Change where this edge leads to
     * @param t The new destination
     */
    public setTo(t: Loc): void {
        this.t = t;
    }

    /**
     * Get an Observable stream of this edge's values
     */
    public getStream(): Observable<any> {
        return this.valueStream;
    }

    public getFromIDString(): string {
        const { node, prop } = this.getFrom();
        return Edge.getPropIDString(node, prop, false);
    }

    public getToIDString(): string {
        const { node, prop } = this.getTo();
        return Edge.getPropIDString(node, prop, true);
    }

    public getID(): string { return `${this.id}`; }

    public static getPropIDString(node: Node, prop: string, incoming: boolean): string {
        return `${node.getIDString()}.${incoming ? 'in' : 'out' }.${prop}`;
    }
}