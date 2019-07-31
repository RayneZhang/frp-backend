import { Node } from './Node';
import { Observable, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface Loc {
    node: Node,
    prop: string,
    // side: 'input' | 'output'
}

export class Edge {
    private fromStream: ReplaySubject<Observable<any>> = new ReplaySubject<Observable<any>>();
    private valueStream: Observable<any>;
    constructor(private f: Loc, private t: Loc) {
        this.setFrom(f);
        this.setTo(t);

        this.valueStream = this.fromStream.pipe(switchMap((stream: Observable<any>): Observable<any> => {
            return stream;
        }));
        // this.valueStream.subscribe({
        //     next: (v) => {
        //     console.log(v);
        // }})
    }
    public getFrom(): Loc { return this.f; }
    public getTo(): Loc { return this.t; }
    public setFrom(f: Loc): void {
        this.f = f;

        const { node, prop } = this.getFrom();
        this.fromStream.next(node.pluckOutput(prop));
    }
    public setTo(t: Loc): void {
        this.t = t;
    }
    public getStream(): Observable<any> {
        return this.valueStream;
    }
}