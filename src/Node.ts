import { Observable, ReplaySubject, ObservableInput, from, of, BehaviorSubject, combineLatest } from "rxjs";
import { pluck, map, mergeMap, switchMap } from "rxjs/operators";
import { Edge } from "./Edge";
import update from 'immutability-helper';

export const PROP_DEFAULT_NAME = '';

interface InputInfo {
    name: string,
    optional?: boolean,
    default?: any
    rest?: boolean,
    type?: string,
    raw?: boolean
}
interface OutputInfo {
    name: string,
    type?: string
}
export abstract class Node<I, O> {
    private incomingEdges: BehaviorSubject<Edge[]> = new BehaviorSubject([]);
    private outgoingEdges: BehaviorSubject<Edge[]> = new BehaviorSubject([]);
    protected inputStream: Observable<any[]>;
    public constructor() {
    }
    protected establishInputStream(): void {
        const inputInfoStream = this.getInputInfoStream();
        const inputAndInfo = combineLatest(inputInfoStream, this.incomingEdges);
        this.inputStream = inputAndInfo.pipe(map(([inputInfo, incomingEdges]: [InputInfo[], Edge[]]) => {
            const propStreams: Map<String, Observable<any>[]> = new Map();
            incomingEdges.forEach((edge: Edge) => {
                const { prop } = edge.getTo();
                const edgeStream = edge.getStream();
                if(propStreams.has(prop)) {
                    const streams = propStreams.get(prop);
                    const newStreams = update(streams, {$push: [edgeStream]});
                    propStreams.set(prop, newStreams);
                } else {
                    propStreams.set(prop, [edgeStream]);
                }
            });

            const args = [];
            inputInfo.forEach((ii: InputInfo): void => {
                const { name, raw } = ii;
                if(propStreams.has(name)) {
                    const props = propStreams.get(name);
                    if(ii.rest) {
                        args.push(...props);
                    } else if(props.length === 1) {
                        args.push(props[0]);
                    } else if (props.length === 0) {
                        args.push(undefined);
                    } else {
                        args.push(combineLatest(...props));
                    }
                }
            });
            return args;
        }));
    }
    public getIncomingEdgesStream(): Observable<Edge[]> {
        return this.incomingEdges;
    }
    public getOutgoingEdgesStream(): Observable<Edge[]> {
        return this.outgoingEdges;
    }

    public addIncomingEdge(edge: Edge): void {
        const ie = this.incomingEdges.getValue();
        const newIncomingEdges = update(ie, {$push: [edge]});
        this.incomingEdges.next(newIncomingEdges);
    }
    public addOutgoingEdge(edge: Edge): void {
        const oe = this.outgoingEdges.getValue();
        const newOutgoingEdges = update(oe, {$push: [edge]});
        this.outgoingEdges.next(newOutgoingEdges);
    }

    public removeIncomingEdge(edge: Edge): void {
        const ie = this.incomingEdges.getValue();
        const i = ie.indexOf(edge);
        if(i>=0) {
            const newIncomingEdges = update(ie, {$splice: [[i, 1]]});
            this.incomingEdges.next(newIncomingEdges);
        }
    }

    public removeOutgoingEdge(edge: Edge): void {
        const oe = this.outgoingEdges.getValue();
        const i = oe.indexOf(edge);
        if(i>=0) {
            const newOutgoingEdges = update(oe, {$splice: [[i, 1]]});
            this.outgoingEdges.next(newOutgoingEdges);
        }
    }

    public abstract getOutputStream(): Observable<O>;
    public abstract getInputInfoStream(): Observable<InputInfo[]>;
    public abstract getOutputInfoStream(): Observable<OutputInfo[]>;
    public pluckOutput(prop: string=PROP_DEFAULT_NAME): Observable<any> {
        const outputStream = this.getOutputStream();
        return outputStream.pipe(pluck(prop));
    }
}

export class ConstantNode<T> extends Node<null, T> {
    private stream: Observable<any>;
    private inputInfoStream: Observable<InputInfo[]>;
    private outputInfoStream: Observable<OutputInfo[]>;
    public constructor(value: T, outputInfo: OutputInfo={name: PROP_DEFAULT_NAME}) {
        super();
        this.stream = of({
            [outputInfo.name]: value
        });
        this.inputInfoStream = new BehaviorSubject([]);
        this.outputInfoStream = new BehaviorSubject([outputInfo]);
        this.establishInputStream();
    }

    public getOutputStream(): Observable<T> { return this.stream; };
    public getInputInfoStream(): Observable<InputInfo[]> {
        return this.inputInfoStream;
    };
    public getOutputInfoStream(): Observable<OutputInfo[]> {
        return this.outputInfoStream;
    };
}


abstract class StaticInfoNode<I, O>  extends Node<I, O> {
    protected out: Observable<any>;
    private inputInfoStream: Observable<InputInfo[]>;
    private outputInfoStream: Observable<OutputInfo[]>;

    public constructor(inputs: InputInfo[], output: OutputInfo[]) {
        super();
        this.inputInfoStream = new BehaviorSubject(inputs);
        this.outputInfoStream = new BehaviorSubject(output);
        this.establishInputStream();
        // this.out =   this.inputStream.pipe();
    }

    public getOutputStream(): Observable<O> { 
        return this.out;
    }
    public getInputInfoStream(): Observable<InputInfo[]> {
        return this.inputInfoStream;
    }
    public getOutputInfoStream(): Observable<OutputInfo[]> {
        return this.outputInfoStream;
    }
}

export class OpNode<T, R> extends StaticInfoNode<T, R> {
    public constructor(private func: (...args: any[]) => R, inputs: InputInfo[], output: OutputInfo) {
        super(inputs, [output]);
        this.establishInputStream();
        //this.inputStream is a stream
        //    of arrays of streams (values)
        //   x: (1---2--3)  \
        //                   >-- (+)
        //   y: (5---6---)  /

        // Stream( [ Stream(1,2,3), Stream(5,6)])
        this.out = this.inputStream.pipe(
            map((inp: Observable<any>[]) => {
                return combineLatest(...inp); // produce a stream of the latest values for every arg ( stream of arrays ): Stream([3,6])
            }),
        ).pipe(
            mergeMap((args: Observable<any[]>) => {
                return args.pipe(map((args) => {
                    return {
                        [output.name]: this.func(...args)
                    };
                }));
            })
        );
    }
}

export class GenNode extends StaticInfoNode<null, Observable<number>> {
    private intervalID: number = -1;
    protected out: BehaviorSubject<{[key: string]: number}>;
    public constructor() {
        super([{
            name: 'delay'
        }], [{
            name: PROP_DEFAULT_NAME
        }]);
        this.out = new BehaviorSubject<{[key: string]: number}>(this.getRandom());
        this.inputStream.pipe(
            map((inp: Observable<any>[]) => {
                return combineLatest(...inp);
            })
        ).pipe(
            mergeMap((args: Observable<any[]>) => {
                return args.pipe(map((args) => {
                    return args[0]
                }));
            })
        ).subscribe({
            next: (delay: number) => {
                this.clear();
                this.set(delay);
            }
        });
    }
    private clear(): void {
        if(this.intervalID >= 0) {
            clearInterval(this.intervalID);
            this.intervalID = -1;
        }
    }
    private set(delay: number): void {
        this.intervalID = setInterval(() => {
            this.out.next(this.getRandom());
        }, delay);
    }
    private getRandom(): { [key: string]: number } {
        return {
            [PROP_DEFAULT_NAME]: Math.random()
        };
    };
}