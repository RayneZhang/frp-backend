import { Observable, ReplaySubject, ObservableInput, from, of, BehaviorSubject, combineLatest, merge, isObservable } from "rxjs";
import { pluck, map, mergeMap, switchMap } from "rxjs/operators";
import { Edge } from "./Edge";
import update, {extend} from 'immutability-helper';
import { keys } from 'lodash';
import _default from "immutability-helper";

export const PROP_DEFAULT_NAME = '';

interface NodeOutput {
    [name: string]: any
};

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
    type?: string,
    raw?: boolean
}
export abstract class Node {
    private incomingEdges: BehaviorSubject<Edge[]> = new BehaviorSubject([]);
    private outgoingEdges: BehaviorSubject<Edge[]> = new BehaviorSubject([]);
    protected inputStream: Observable<any[]>;
    public constructor() {
    }
    protected establishInputStream(): void {
        //InputInfoStream: A stream of InputInfo arrays
        const inputInfoStream = this.getInputInfoStream();

        // inputAndInfo: A stream with length-two items:
        //    1) the first is an InputInfo array
        //    2) an array of Edges
        const inputAndInfo = combineLatest(this.incomingEdges, inputInfoStream);

        // this.inputStream: a stream of (arrays of (streams of arg values) )
        this.inputStream = inputAndInfo.pipe(map(([incomingEdges, inputInfo]: [Edge[], InputInfo[]]) => {
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
                        if(raw) {
                            args.push(of(props[0]));
                        } else {
                            args.push(props[0]);
                        }
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

    public abstract getOutputStream(): Observable<NodeOutput>;
    public abstract getInputInfoStream(): Observable<InputInfo[]>;
    public abstract getOutputInfoStream(): Observable<OutputInfo[]>;
    public pluckOutput(prop: string=PROP_DEFAULT_NAME): Observable<any> {
        const outputStream = this.getOutputStream();
        return outputStream.pipe(pluck(prop));
    }
}

export class ConstantNode extends Node {
    private stream: Observable<any>;
    private inputInfoStream: Observable<InputInfo[]>;
    private outputInfoStream: Observable<OutputInfo[]>;
    public constructor(value: any, outputInfo: OutputInfo={name: PROP_DEFAULT_NAME}) {
        super();
        this.stream = of({
            [outputInfo.name]: value
        });
        this.inputInfoStream = new BehaviorSubject([]);
        this.outputInfoStream = new BehaviorSubject([outputInfo]);
        this.establishInputStream();
    }

    public getOutputStream(): Observable<any> { return this.stream; };
    public getInputInfoStream(): Observable<InputInfo[]> {
        return this.inputInfoStream;
    };
    public getOutputInfoStream(): Observable<OutputInfo[]> {
        return this.outputInfoStream;
    };
}


abstract class StaticInfoNode extends Node {
    protected out: Observable<NodeOutput>;
    protected managedOut: Observable<NodeOutput>;
    private inputInfoStream: Observable<InputInfo[]>;
    private outputInfoStream: Observable<OutputInfo[]>;

    public constructor(inputs: InputInfo[], output: OutputInfo[]) {
        super();
        this.inputInfoStream = new BehaviorSubject(inputs);
        this.outputInfoStream = new BehaviorSubject(output);
        this.establishInputStream();
    }

    public getOutputStream(): Observable<NodeOutput> { 
        return this.managedOut;
    }
    public getInputInfoStream(): Observable<InputInfo[]> {
        return this.inputInfoStream;
    }
    public getOutputInfoStream(): Observable<OutputInfo[]> {
        return this.outputInfoStream;
    }
    protected establishOutputStream(): void {
        const outputInfoStream = this.getOutputInfoStream();

        const outputAndInfo = combineLatest(this.out, outputInfoStream)

        this.managedOut = outputAndInfo.pipe(mergeMap(([outValue, outputInfo]: [NodeOutput, OutputInfo[]]) => {
            const rawProps: Set<string> = new Set(outputInfo.filter((oi) => oi.raw).map((oi) => oi.name));
            const individualDictStreams = keys(outValue).map((key: string) =>  {
                const val = outValue[key];
                if(rawProps.has(key) && isObservable(val))  {
                    return val.pipe(map((v) => ({ [key]: v })));
                } else {
                    return of({ [key]: val });
                }
            });

            return combineLatest(...individualDictStreams).pipe(map((val) => {
                return Object.assign({}, ...val);
            }));
        }))
    }
}

export class OpNode extends StaticInfoNode {
    public constructor(private func: (...args: any[]) => any, inputs: InputInfo[], output: OutputInfo) {
        super(inputs, [output]);
        this.establishInputStream();
        // this.inputStream: a stream of (arrays of (streams of arg values) )
        //   x: (1---2--3) -\
        //                   >-- (+)
        //   y: (5---6---) -/

        // this.inputStream: Stream( [ Stream(1,2,3), Stream(5,6) ] )
        this.out = this.inputStream.pipe(
            mergeMap((args: Observable<any>[]) => { // 
                // args is an array of streams
                return combineLatest(...args);
            }),
            map((args: any[]) => {
                //args is an array of arg values
                return {
                    [output.name]: this.func(...args)
                };
            })
        );
        this.establishOutputStream();
    }
}


export class GenNode extends StaticInfoNode {
    private intervalID: number = -1;
    protected out: BehaviorSubject<NodeOutput>;
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
        this.establishOutputStream();
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