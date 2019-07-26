import { WrappedSignal } from './WrappedSignal';
import { WrappedEventStreamSource } from './WrappedEventStream';
import { WrappedObservable } from './WrappedObservable';
import { WrappedOp } from './WrappedOp';
import { combineLatest, from, merge, Observable, of, BehaviorSubject, ReplaySubject } from "rxjs";
import { delay, map, pluck, startWith, take } from "rxjs/operators";
import { ops, observables } from './Ops';

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
export interface FBOps {
    [name: string]: FBOp
}

interface FBParam {
    name: string,
    default?: any,
    optional?: boolean,
    type?: string
}
interface FBObservable {
    args: FBArg[],
    output: FBOut[],
    params?: FBParam[],
    fn(...args: any[]): any;
}

export interface FBObservables {
    [name: string]: FBObservable
}


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

export class SceneOp {

}

export class SceneEdge {

}


export class Scene {
    private static id_num: number = 0;
    private wrappedObservables: Map<string, WrappedObservable<any>> = new Map();
    // { [id: string]: WrappedObservable<any> } = {};
    private observables: Map<string, Observable<any>> = new Map();
    // { [id: string]: Observable<any> } = {};
    constructor(private state: FBScene = { scene: [] }) {
        this.updateScene();
    }
    private guid(): string { return `id-${Scene.id_num++}`; }
    public delete(id: string): void {

    }
    public addOp(op: string, input: string[] = []): string {
        const id = this.guid();
        const opValue: FBSceneOp = {
            type: 'op',
            id, op, input
        };
        this.state.scene.push(opValue);
        this.updateObs(opValue);
        this.updateOpInput(opValue);
        this.subscribeToObservable(opValue);
        return id;
    }
    public addConstant(value: any): string {
        const id = this.guid();
        const constantVal: FBSceneConstant = {
            type: 'constant',
            id, value
        };
        this.state.scene.push(constantVal);
        this.updateObs(constantVal);
        this.subscribeToObservable(constantVal);
        return id;
    }
    public addObservable(op: string, parameters: any[] = [], pipe?: string): string {
        const id = this.guid();
        const observableVal: FBSceneObservable = {
            type: 'observable',
            id, op, parameters, pipe
        };
        this.state.scene.push(observableVal);
        this.updateObs(observableVal);
        this.pipeObservable(observableVal);
        this.subscribeToObservable(observableVal);
        return id;
    }
    private updateObs(obj: FBSceneObject): void {
        const { id, type } = obj;
        if(type === 'constant') {
            const { value } = obj as FBSceneConstant;
            this.wrappedObservables.set(id, new WrappedObservable<any>(of(value)));
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
            this.wrappedObservables.set(id, wop);
        } else if(type === 'observable') {
            const { op, parameters } = obj as FBSceneObservable;
            const { fn, params } = observables[op];
            const ps = params.map((p, i) => {
                const def = p.default;
                const { optional } = p;
                if(parameters.length > i) {
                    return parameters[i];
                } else if(def) {
                    return def;
                } else if (optional) {
                    return null;
                } else {
                    throw new Error();
                }
            });
            const observable = fn(...ps);
            this.observables.set(id, observable);
        }
    }
    private pipeObservable(obs: FBSceneObservable): void {
        const { id, type, op, pipe } = obs;
        const observable = this.observables.get(id);
        if(pipe) {
            const wrappedObservable = this.wrappedObservables.get(pipe);
            this.wrappedObservables.set(id, wrappedObservable.pipe(observable));
        } else {
            this.wrappedObservables.set(id, new WrappedObservable<any>(observable));
        }
    }
    private updateOpInput(op: FBSceneOp): void {
        const { id, input, type } = op;
        const getInput = (inp_id: string): Observable<any> => {
            if(inp_id.indexOf('.') >= 0) {
                const [obj_id, prop_name] = inp_id.split('.');

                const observable = this.wrappedObservables.get(obj_id).getObservable();
                const propObservable = observable.pipe(pluck(prop_name));
                return propObservable;
            } else {
                return this.wrappedObservables.get(inp_id).getObservable();
            }
        };
        const inps = new WrappedObservable(combineLatest<any>(...input.map(getInput)));
        const observable = this.wrappedObservables.get(id) as WrappedOp<any, any>;
        observable.setInput(inps);
    }
    private subscribeToObservable(obs): void {
        const { id } = obs;
        this.wrappedObservables.get(id).subscribe({
            next: (x) => {
                console.log(id, 'is now', x);
            }
        });
    };
    private updateScene() {
        this.state.scene.forEach((obj) => { this.updateObs(obj); });
        this.state.scene.filter((o) => o.type === 'observable').forEach((obs) => { this.pipeObservable(obs as FBSceneObservable); });
        this.state.scene.filter((o) => o.type === 'op').forEach((op) => { this.updateOpInput(op as FBSceneOp); });
        this.state.scene.forEach((o) => { this.subscribeToObservable(o); });
    }
}

/* API for recording data dependencies
Drawing an edge represents the dependency between the two objects.
Want a list of all of the edges (source and target for every edge).

Source and target objects should have attributes....edge between a cube and sphere, which attribute is it connecting?

Adding edges into the state of the system, would be useful for modifying or deleting an edge


Every edge will have a unique id
Edges should be represented in a class

Operations/everything should be their own object
*/