import { WrappedSignal } from './WrappedSignal';
import { WrappedEventStreamSource } from './WrappedEventStream';
import { WrappedObservable } from './WrappedObservable';
import { WrappedOp } from './WrappedOp';
import { combineLatest, from, merge, Observable, of } from "rxjs";
import { delay, map, pluck, startWith, take } from "rxjs/operators";

interface FBArg {
    name: string,
    rest?: boolean,
    optional?: boolean,
    default?: any
    type?: string
}
interface FBOut {
    name: string,
    type?: string
}
interface FBOp {
    args: FBArg[],
    output: FBOut[],
    fn: (...args: any[]) => any
}
interface FBOps {
    [name: string]: FBOp
}
const ops: FBOps = {
    '+': {
        args: [{name: 'nums', rest: true}],
        output: [{name: 'sum'}],
        fn: (args: number[]): [number] => {
            return [args.reduce((pv: number, cv: number) => pv + cv, 0)];
        }
    }
};

interface FBParam {
    name: string
}
interface FBObservable {
    args: FBArg[],
    output: FBOut[],
    params?: FBParam[],
    fn(...args: any[]): any;
}

interface FBObservables {
    [name: string]: FBObservable
}

const observables: FBObservables = {
    'gen': {
        args: [],
        output: [ { name: ''}],
        params: [ { name: 'delay' }],
        fn: (delay) => {
            return new Observable(sub => {
                let timeout = null;
            
                // recursively send a random number to the subscriber
                // after a random delay
                (function push() {
                    timeout = setTimeout(
                        () => {
                            sub.next(Math.random());
                            push();
                        },
                        delay
                    );
                })();
            
                // clear any pending timeout on teardown
                return () => clearTimeout(timeout);
            }).pipe(startWith(Math.random()));
        }
    },
    'take': {
        args: [],
        output: [ { name: ''}],
        params: [ { name: 'count' }],
        fn: (count) => {
            return take(count);
        }
    }
};

interface FBSceneBase {
    id: string
};
interface FBSceneConstant extends FBSceneBase {
    type: 'constant',
    value: any
}
interface FBSceneOp extends FBSceneBase {
    type: 'op',
    op: string,
    input?: string[],
}
interface FBSceneObservable extends FBSceneBase {
    type: 'observable',
    op: string,
    input?: string[],
    parameters?: any[],
    pipe?: string
}
type FBSceneObject = FBSceneConstant|FBSceneOp|FBSceneObservable;
interface FBScene {
    scene: Array<FBSceneObject>
}


export class Scene {
    private static id_num: number = 0;
    private wrappedObservables: { [id: string]: WrappedObservable<any> };
    private observables: { [id: string]: Observable<any> };
    constructor(private state: FBScene = { scene: [] }) {
        this.updateScene();
    }
    private guid(): string { return `id-${Scene.id_num++}`; }
    public addOp(op: string, input: string[]): string {
        const id = this.guid();
        this.state.scene.push({
            type: 'op',
            id, op, input
        });
        return id;
    }
    public addConstant(value: any): string {
        const id = this.guid();
        this.state.scene.push({
            type: 'constant',
            id, value
        });
        return id;
    }
    public addObservable(op: string, parameters: any[] = [], pipe?: string): string {
        const id = this.guid();
        this.state.scene.push({
            type: 'observable',
            id, op, parameters, pipe
        });
        return id;
    }
    private updateObs(obj: FBSceneObject): void {
        const { id, type } = obj;
        if(type === 'constant') {
            const { value } = obj as FBSceneConstant;
            this.wrappedObservables[id] = new WrappedObservable<any>(of(value));
        } else if(type === 'op') {
            const { op } = obj as FBSceneOp;
            const opInfo = ops[op];
            if(!opInfo) {
                throw new Error('No op ' + op);
            }
            const { fn, output } = opInfo;
            const outputNames = output.map((o) => o.name);
            const mappedOutputs = (...args: any[]): {[key: string]: any} => {
                const result: any[] = fn(...args);
                const rv = {};
                result.forEach((r: any, i: number) => {
                    rv[outputNames[i]] = r;
                });
                return rv;
            };
            const wop = new WrappedOp(mappedOutputs);
            this.wrappedObservables[id] = wop;
        } else if(type === 'observable') {
            const { op, parameters } = obj as FBSceneObservable;
            const observable = observables[op].fn(...parameters);
            this.observables[id] = observable;
        }
    }
    private pipeObservable(obs: FBSceneObservable): void {
        const { id, type, op, pipe } = obs;
        if(pipe) {
            this.wrappedObservables[id] = this.wrappedObservables[pipe].pipe(this.observables[id]);
        } else {
            this.wrappedObservables[id] = new WrappedObservable<any>(this.observables[id]);
        }
    }
    private updateOpInput(op: FBSceneOp): void {
        const { id, input, type } = op;
        const getInput = (inp_id: string): Observable<any> => {
            if(inp_id.indexOf('.') >= 0) {
                const [obj_id, prop_name] = inp_id.split('.');

                const observable = this.wrappedObservables[obj_id].getObservable();
                const propObservable = observable.pipe(pluck(prop_name));
                return propObservable;
            } else {
                return this.wrappedObservables[inp_id].getObservable();
            }
        };
        const inps = new WrappedObservable(combineLatest<any>(...input.map(getInput)));
        const observable = this.wrappedObservables[id] as WrappedOp<any, any>;
        observable.setInput(inps);
    }
    private updateScene() {
        this.state.scene.forEach((obj) => { this.updateObs(obj); });
        this.state.scene.filter((o) => o.type === 'observable').forEach((obs) => { this.pipeObservable(obs as FBSceneObservable); });
        this.state.scene.filter((o) => o.type === 'op').forEach((op) => { this.updateOpInput(op as FBSceneOp); });
        this.state.scene.forEach((x) => {
            const { id } = x;
            this.wrappedObservables[id].subscribe({
                next: (x) => {
                    console.log(id, 'is now', x);
                }
            });
        });
    }
}