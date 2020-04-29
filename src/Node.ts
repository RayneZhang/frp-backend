import { Observable, of, BehaviorSubject, combineLatest, isObservable, Subject, Subscription } from "rxjs";
import { pluck, map, mergeMap, switchMap } from "rxjs/operators";
import { Edge } from "./Edge";
import update from 'immutability-helper';
import _default from "immutability-helper";

// If a name isn't supplied for a given property, this is the name that is used
export const PROP_DEFAULT_NAME = '';

// Represents whether a given property is an input property or output property
export enum IO { Input=1, Output=2 };

// Every node outputs a dictionary where the keys are property names and the values can be anything
interface NodeOutput {
    [name: string]: any
};

// Information about a given input for a node
export interface InputInfo {
    name: string, // The name of this input
    optional?: boolean, // Whether or not a value needs to be supplied
    default?: any, // the default value if a value isn't supplied
    rest?: boolean, // whether this input should "consume" everything else passed to it
    type?: string, // the type of this input
    update?: any, // the update value if the default is dynamic
    raw?: boolean // Whether to input the raw stream object itself (as opposed to the value of the stream)
}

// Information about a given output for a node
export interface OutputInfo {
    name: string, // The name of this output
    type?: string, // The type of this output
    raw?: boolean // Whether the output supplied should be taken as a raw stream
}

export interface UpdateInfo {
    name: string, // The name of this output
    value: any, // The value
    type?: string, // The type of this output
    raw?: boolean // Whether the output supplied should be taken as a raw stream
}

// The layout of a given property: x, y, width, and height
export interface NodePropLayout {
    x: number,
    y: number,
    width: number,
    height: number
}

// The layout of a given node
export interface NodeLayout {
    width: number,
    height: number,
    x: number,
    y: number,
    inputs: {
        [name: string]: NodePropLayout
    },
    outputs: {
        [name: string]: NodePropLayout
    },
}

/**
 * A class representing a node. Nodes have input and output properties, each of which has values.
 * The node itself does *not* have a value
 */
export abstract class Node {
    private static nodeCount: number = 1; // How many nodes are there (used for getting unique IDs)

    private id: number; // This node's unique ID
    private incomingEdges: BehaviorSubject<Edge[]> = new BehaviorSubject([]); // A stream whose value is an array of incoming edges
    private outgoingEdges: BehaviorSubject<Edge[]> = new BehaviorSubject([]); // A stream whose value is an array of outgoing edges
    private layout: Subject<NodeLayout> = new BehaviorSubject({ width: 0, height: 0, x: 0, y: 0, inputs: {}, outputs: {} }); // A stream with info about how this node should be positioned
    protected inputStream: Observable<any[]>; // A stream that combines information from this.incomingEdges to compute *all* of the inputs to this node

    public constructor(private label: string) {
        this.id = Node.nodeCount++; // Get a unique id
    }

    /**
     * Get the total node count in the scene.
     */
    public static getNodeCount(): number { return this.nodeCount; }

    /**
     * Get a human-readable label for this node
     */
    public getLabel(): string { return this.label; } 

    /**
     * Get a stream with information about this node's layout
     */
    public getLayoutStream(): Observable<NodeLayout> { return this.layout; }

    /**
     * Change the layout of this node (note: this should *not* be called manually)
     * @param l The new layout for this node
     */
    public _setLayout(l: NodeLayout): void { this.layout.next(l); }

    /**
     * Sets the "inputStream" property, which computes one object of input values from this node's input edges
     */
    protected establishInputStream(): void {
        //InputInfoStream: A stream of InputInfo arrays
        const inputInfoStream = this.getInputInfoStream();

        // inputAndInfo: A stream with length-two items:
        //    1) the first is an InputInfo array
        //    2) an array of Edges
        const inputAndInfo = combineLatest(this.incomingEdges, inputInfoStream);

        // this.inputStream: a stream of (arrays of (streams of arg values) )
        this.inputStream = inputAndInfo.pipe(map(([incomingEdges, inputInfo]: [Edge[], InputInfo[]]) => {
            // For every input property (string) specified by inputInfo, get an *array of streams* that are pointing to that input property
            const propStreams: Map<String, Observable<any>[]> = new Map();

            //Lot at every incoming edge and bucket them into the correct property
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

            // We have a map of input properties to lists of streams...
            // now, we want to convert that into an ordered array of argument values
            // whose order is determined by this.inputInfo

            const args = [];
            // For every inputInfo...
            inputInfo.forEach((ii: InputInfo): void => {
                const { name, raw } = ii;
                // If we have a stream for that...
                if(propStreams.has(name)) {
                    const props = propStreams.get(name);
                    if(ii.rest) { // If we're supposed to consume the rest of the arguments
                        args.push(...props); // Just push all of them in there as arguments
                    } else if(props.length === 1) { // If we have one thing passed in for this prop value
                        if(raw) { // If it's raw, wrap it in an observable (so that when it's unwrapped, we get the raw stream back)
                            args.push(of(props[0]));
                        } else {
                            args.push(props[0]); // Otherwise, just pass the actual stream
                        }
                    } else if (props.length === 0) {
                        args.push(undefined); // This shouldn't be called...
                    } else {
                        args.push(combineLatest(...props)); // If we have multiple items, use combineLatest (TODO: not sure if this is actually the best thing to do)
                    }
                } else if(ii.default != null && ii.default != undefined) { // If nothing was supplied but there's a default value, just use the default
                    args.push(of(ii.default));
                } else {
                    args.push(undefined); // Otherwise, just add it as an undefined arg
                }
            });
            return args;
        }));
    }
    /**
     * Get a stream of lists of incoming edges
     */
    public getIncomingEdgesStream(): Observable<Edge[]> { return this.incomingEdges; }
    /**
     * Get a stream of lists of outgoing edges
     */
    public getOutgoingEdgesStream(): Observable<Edge[]> { return this.outgoingEdges; }

    /**
     * Add an edge that points to one of this node's input props
     * @param edge The Edge object that points to one of this node's input props
     */
    public addIncomingEdge(edge: Edge): void {
        const ie = this.incomingEdges.getValue();
        const newIncomingEdges = update(ie, {$push: [edge]});
        this.incomingEdges.next(newIncomingEdges);
    }

    /**
     * Add an edge that points from one of this node's output props
     * @param edge The Edge object that points away from one of this node's output props
     */
    public addOutgoingEdge(edge: Edge): void {
        const oe = this.outgoingEdges.getValue();
        const newOutgoingEdges = update(oe, {$push: [edge]});
        this.outgoingEdges.next(newOutgoingEdges);
    }

    /**
     * Remove an edge that points at one of the input props
     * @param edge The edge to remove
     */
    public removeIncomingEdge(edge: Edge): void {
        const ie = this.incomingEdges.getValue();
        const i = ie.indexOf(edge);
        if(i>=0) { // If this edge actually belongs to this node...
            // Create a new list of edges that has edge removed (using op that does not mutate the actual array)
            const newIncomingEdges = update(ie, {$splice: [[i, 1]]});
            // Set my incoming edges list to that array without edge
            this.incomingEdges.next(newIncomingEdges);
        }
    }

    /**
     * Remove an edge that leaves from one of the output props
     * @param edge The edge to remove
     */
    public removeOutgoingEdge(edge: Edge): void {
        const oe = this.outgoingEdges.getValue();
        const i = oe.indexOf(edge);
        if(i>=0) { // If this edge actually belongs to this node...
            // Create a new list of edges that has edge removed (using op that does not mutate the actual array)
            const newOutgoingEdges = update(oe, {$splice: [[i, 1]]});
            // Set my outgoing edges list to that array without edge
            this.outgoingEdges.next(newOutgoingEdges);
        }
    }

    /**
     * Get a stream with this node's output values (every output should be an object)
     */
    public abstract getOutputStream(): Observable<NodeOutput>;
    /**
     * Get a stream with information about this node's inputs
     */
    public abstract getInputInfoStream(): Observable<InputInfo[]>;
    /**
     * Get a stream with information about this node's outputs
     */
    public abstract getOutputInfoStream(): Observable<OutputInfo[]>;

    /**
     * Clean up after this node gets removed from a scene
     */
    public remove(): void {
        this.incomingEdges.complete();
        this.outgoingEdges.complete();
        this.layout.complete();
    };

    /**
     * Get a stream with values of a given output property
     * @param prop The name of the output property we are interested in
     */
    public pluckOutput(prop: string=PROP_DEFAULT_NAME): Observable<any> {
        const outputStream = this.getOutputStream();
        return outputStream.pipe(pluck(prop));
    }

    /**
     * Get this node's unique ID
     */
    public getID(): string { return `node-${this.id}`; }
}

/** 
 * A node that represents a constant value
 */
export class ConstantNode extends Node {
    private stream: Observable<any>;
    private inputInfoStream: Observable<InputInfo[]> = of([]); // There are no inputs to a constant
    private outputInfoStream: Observable<OutputInfo[]>;
    public constructor(value: any, outputInfo: OutputInfo={name: PROP_DEFAULT_NAME}) {
        super(`${value}`);
        this.stream = of({ [outputInfo.name]: value }); // The output stream
        this.outputInfoStream = of([outputInfo]); // There is typically one output with the default name
        this.establishInputStream(); // (defined by superclass)
    }

    public getOutputStream(): Observable<any> { return this.stream; };
    public getInputInfoStream(): Observable<InputInfo[]> { return this.inputInfoStream; };
    public getOutputInfoStream(): Observable<OutputInfo[]> { return this.outputInfoStream; };
}

/**
 * A superclass that represents any node where the input and output info does *not* change over time (should be  most Nodes)
 */
abstract class StaticInfoNode extends Node {
    protected out: Observable<NodeOutput>; // The output stream that
    protected managedOut: Observable<NodeOutput>; // The *actual* output stream that gets passed on (need to manage for 'raw' values)
    private inputInfoStream: Observable<InputInfo[]>; // A stream with input information
    private outputInfoStream: Observable<OutputInfo[]>; // A stream with output information

    public constructor(label: string, inputs: InputInfo[], output: OutputInfo[]) {
        super(label);
        this.inputInfoStream = of(inputs); // Input info is a constant value, so use of
        this.outputInfoStream = of(output); // Output info is a constant value, so use of
        this.establishInputStream(); // From the superclass
    }

    public getOutputStream(): Observable<NodeOutput> { return this.managedOut; }
    public getInputInfoStream(): Observable<InputInfo[]> { return this.inputInfoStream; }
    public getOutputInfoStream(): Observable<OutputInfo[]> { return this.outputInfoStream; }

    /**
     * Create an output stream that handles 'raw' output attributes
     */
    protected establishOutputStream(): void {
        // We need the outputInfo stream to know what should be raw
        const outputInfoStream = this.getOutputInfoStream();

        // Combine the actual output and information about the output into one stream
        const outputAndInfo = combineLatest(this.out, outputInfoStream)

        this.managedOut = outputAndInfo.pipe(mergeMap(([outValue, outputInfo]: [NodeOutput, OutputInfo[]]) => {
            //OutValue is an object (keys are strings and values are streams)

            //The list of properties that are marked as raw
            const rawProps: Set<string> = new Set(outputInfo.filter((oi) => oi.raw).map((oi) => oi.name));

            // Decompose the output object into a list of streams with individual properties
            // For example: A stream with value Observable({a: 1, b: 2}) becomes [Observable({a: 1}), Observable({b: 2})]
            const individualDictStreams = Object.keys(outValue).map((key: string) =>  {
                const val = outValue[key];
                if(rawProps.has(key) && isObservable(val))  {
                    // If we're supposed to output the raw stream, just pipe the stream's value into this propertie's stream
                    return val.pipe(map((v) => ({ [key]: v })));
                } else {
                    // Otherwise, just return a stream with a static value
                    return of({ [key]: val });
                }
            });

            // Combine all of the property streams back into one object (now, the raw values have been handled)
            return combineLatest(...individualDictStreams).pipe(map((val) => {
                return Object.assign({}, ...val);
            }));
        }))
    }
}

/**
 * Represents a node that is a single operation (static information, any number of inputs, one output)
 */
export class OpNode extends StaticInfoNode {
    protected outputVal: BehaviorSubject<any>; // The internal output property update stream

    public constructor(label: string, private func: (...args: any[]) => any, inputs: InputInfo[], output: OutputInfo) {
        super(label, inputs, [output]);
        this.establishInputStream();
        this.outputVal = new BehaviorSubject<any>(null);

        // this.inputStream: a stream of (arrays of (streams of arg values) )
        //   x: (1---2--3) -\
        //                   >-- (+)
        //   y: (5---6---) -/
        // this.inputStream: Stream( [ Stream(1,2,3), Stream(5,6) ] )
        this.out = this.inputStream.pipe(
                mergeMap((args: Observable<any>[]) => {
                    // args is an array of streams
                    return combineLatest(...args);
                }),
                map((argValues: any[]) => { 
                    const result = this.func(...argValues);
                    if (!result) return {[output.name]: this.outputVal};
                    else return {[output.name]: this.func(...argValues)}; 
                } //argValues is an array of arg values
            )
        );
        this.establishOutputStream();
    }

    /***
     * Allow subscribing to the latest inputs of the OpNode
     */
    public pluckInputs(): Observable<any> {
        return this.inputStream.pipe(
            mergeMap((args: Observable<any>[]) => {
                // args is an array of streams
                return combineLatest(...args);
            }),
            mergeMap((argValues: any[]) => {
                return combineLatest(...argValues);
            })
        );
    }

    public updateOutput(name: string, _value: any): void {
        this.outputVal.next(_value);
    }
}

/** 
 * A node that generates random numbers at an interval
 */
export class GenNode extends StaticInfoNode {
    private intervalID: number = -1; // The ID of the JavaScript timer
    protected out: Subject<NodeOutput>; // The ouput stream
    private subscription: Subscription;
    public constructor(name: string = 'gen') {
        super(name, [{
            name: 'delay' // one input for delay between generations
        }], [{
            name: PROP_DEFAULT_NAME // one putput with the random number
        }]);
        this.out = new BehaviorSubject<{[key: string]: number}>(this.getRandom()); // The output starts with a random value
        this.subscription = this.inputStream.pipe(
            map((inp: Observable<any>[]) => { // combine all of the arguments into  one array
                return combineLatest(...inp);
            })
        ).pipe(
            mergeMap((args: Observable<any[]>) => {
                //  Take the value of the first arg
                return args.pipe(map((args) => {
                    return args[0]
                }));
            })
        ).subscribe({
            next: (delay: number) => {
                //  delay is the current delay between random number generations
                this.clear(); // clear any existing timer
                this.set(delay); // and set a new timer
            }
        });
        this.establishOutputStream();
    }

    /**
     * Clear any set timer for generating a new number
     */
    private clear(): void {
        if(this.intervalID >= 0) {
            clearInterval(this.intervalID);
            this.intervalID = -1;
        }
    }

    /**
     * Set a timer for generating a new number
     * @param delay How long to wait before generating a new number
     */
    private set(delay: number): void {
        this.intervalID = setInterval(() => {
            this.out.next(this.getRandom());
        }, delay);
    }

    /**
     * Get a new random number
     */
    private getRandom(): { [key: string]: number } {
        return { [PROP_DEFAULT_NAME]: Math.random() };
    };

    /**
     * Remove this node from the scene
     */
    public remove(): void {
        super.remove();
        this.clear();
        this.out.complete();
        this.subscription.unsubscribe();
    };
}

/**
 * A node that represents a 3D model
 */
export class ObjNode extends StaticInfoNode {
    protected updateInfo: BehaviorSubject<UpdateInfo[]>; // The internal property update stream

    public constructor(label: string, inputs: InputInfo[]) {
        // Initiate outputs using the same info as inputs.
        const outputs: OutputInfo[] = inputs.map((input: InputInfo) => ({name: input.name, type: input.type, raw: input.raw}));
        super(label, inputs, outputs);
        // Initiate updates using the same info as inputs.
        const updates: UpdateInfo[] = inputs.map((input: InputInfo) => ({name: input.name, value: input.default, type: input.type, raw: input.raw}));
        this.updateInfo = new BehaviorSubject<UpdateInfo[]>(updates);

        const inputsAndUpdates = combineLatest(this.inputStream.pipe(
            switchMap((args: Observable<any>[]) => {
                return combineLatest(...args);
            })
        ), this.updateInfo);        

        this.out = inputsAndUpdates.pipe(
            map(([argValues, updates] : [any[], UpdateInfo[]]) => {
                let result = {};
                // Map each output name to the corresponding value.
                outputs.forEach((prop: OutputInfo, i: number) => {
                    if (argValues[i] === inputs[i].default)
                        result[prop.name] = updates[i].value;
                    else
                        result[prop.name] = argValues[i];
                });
                return result;
            })
        );
        this.establishOutputStream();
    };

    public update(name: string, _value: any): void {
        const latestUpdate: UpdateInfo[] = this.updateInfo.getValue();
        for (let i = 0; i < latestUpdate.length; i++) {
            // We also handled property names that do not exist.
            if (latestUpdate[i].name === name) {
                latestUpdate[i].value = _value;
                break;
            }
        }
        // console.log(this.updateInfo.getValue());
        this.updateInfo.next(latestUpdate);
        
    }
}

/**
 * Represents a puppet node that only updates the ouputs from function calls.
 */
export class PupNode extends StaticInfoNode {
    protected outputVals: BehaviorSubject<any[]>; // The internal output property update stream

    public constructor(label: string, inputs: InputInfo[], outputs: OutputInfo[]) {
        super(label, inputs, outputs);
        this.establishInputStream();
        this.outputVals = new BehaviorSubject<any[]>(null);

        const initOutputs: any[] = new Array<any>();
        for (let i = 0; i < outputs.length; i++) {
            const name: string = outputs[i].name;
            const out: any = {};
            out.name = name;
            out.value = null;
            initOutputs.push(out);
        }
        this.outputVals.next(initOutputs);
        this.out = this.outputVals.pipe(
            map((outValues : any[]) => {
                let result = {};
                // Map each output name to the corresponding value.
                outValues.forEach((prop: any, i: number) => {
                    result[prop.name] = prop.value;
                });
                return result;
            })
        );
        this.establishOutputStream();
    }

    /***
     * Allow subscribing to the latest inputs of the OpNode
     */
    public pluckInputs(): Observable<any> {
        return this.inputStream.pipe(
            switchMap((args: Observable<any>[]) => {
                if (args.indexOf(undefined) != -1)
                    return combineLatest([]);
                // args is an array of streams
                return combineLatest(...args);
            })
        );
    }

    public updateOutput(name: string, _value: any): void {
        const latestOutput: any[] = this.outputVals.getValue();
        for (let i = 0; i < latestOutput.length; i++) {
            // We also handled property names that do not exist.
            if (latestOutput[i].name === name) {
                latestOutput[i].value = _value;
                break;
            }
        }
        this.outputVals.next(latestOutput);
    }
}