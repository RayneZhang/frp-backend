"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var immutability_helper_1 = require("immutability-helper");
// If a name isn't supplied for a given property, this is the name that is used
exports.PROP_DEFAULT_NAME = '';
// Represents whether a given property is an input property or output property
var IO;
(function (IO) {
    IO[IO["Input"] = 1] = "Input";
    IO[IO["Output"] = 2] = "Output";
})(IO = exports.IO || (exports.IO = {}));
;
;
/**
 * A class representing a node. Nodes have input and output properties, each of which has values.
 * The node itself does *not* have a value
 */
var Node = /** @class */ (function () {
    function Node(label) {
        this.label = label;
        this.incomingEdges = new rxjs_1.BehaviorSubject([]); // A stream whose value is an array of incoming edges
        this.outgoingEdges = new rxjs_1.BehaviorSubject([]); // A stream whose value is an array of outgoing edges
        this.layout = new rxjs_1.BehaviorSubject({ width: 0, height: 0, x: 0, y: 0, inputs: {}, outputs: {} }); // A stream with info about how this node should be positioned
        this.id = Node.nodeCount++; // Get a unique id
    }
    /**
     * Get a human-readable label for this node
     */
    Node.prototype.getLabel = function () { return this.label; };
    /**
     * Get a stream with information about this node's layout
     */
    Node.prototype.getLayoutStream = function () { return this.layout; };
    /**
     * Change the layout of this node (note: this should *not* be called manually)
     * @param l The new layout for this node
     */
    Node.prototype._setLayout = function (l) { this.layout.next(l); };
    /**
     * Sets the "inputStream" property, which computes one object of input values from this node's input edges
     */
    Node.prototype.establishInputStream = function () {
        //InputInfoStream: A stream of InputInfo arrays
        var inputInfoStream = this.getInputInfoStream();
        // inputAndInfo: A stream with length-two items:
        //    1) the first is an InputInfo array
        //    2) an array of Edges
        var inputAndInfo = rxjs_1.combineLatest(this.incomingEdges, inputInfoStream);
        // this.inputStream: a stream of (arrays of (streams of arg values) )
        this.inputStream = inputAndInfo.pipe(operators_1.map(function (_a) {
            var incomingEdges = _a[0], inputInfo = _a[1];
            // For every input property (string) specified by inputInfo, get an *array of streams* that are pointing to that input property
            var propStreams = new Map();
            //Lot at every incoming edge and bucket them into the correct property
            incomingEdges.forEach(function (edge) {
                var prop = edge.getTo().prop;
                var edgeStream = edge.getStream();
                if (propStreams.has(prop)) {
                    var streams = propStreams.get(prop);
                    var newStreams = immutability_helper_1["default"](streams, { $push: [edgeStream] });
                    propStreams.set(prop, newStreams);
                }
                else {
                    propStreams.set(prop, [edgeStream]);
                }
            });
            // We have a map of input properties to lists of streams...
            // now, we want to convert that into an ordered array of argument values
            // whose order is determined by this.inputInfo
            var args = [];
            // For every inputInfo...
            inputInfo.forEach(function (ii) {
                var name = ii.name, raw = ii.raw;
                // If we have a stream for that...
                if (propStreams.has(name)) {
                    var props = propStreams.get(name);
                    if (ii.rest) { // If we're supposed to consume the rest of the arguments
                        args.push.apply(// If we're supposed to consume the rest of the arguments
                        args, props); // Just push all of them in there as arguments
                    }
                    else if (props.length === 1) { // If we have one thing passed in for this prop value
                        if (raw) { // If it's raw, wrap it in an observable (so that when it's unwrapped, we get the raw stream back)
                            args.push(rxjs_1.of(props[0]));
                        }
                        else {
                            args.push(props[0]); // Otherwise, just pass the actual stream
                        }
                    }
                    else if (props.length === 0) {
                        args.push(undefined); // This shouldn't be called...
                    }
                    else {
                        args.push(rxjs_1.combineLatest.apply(void 0, props)); // If we have multiple items, use combineLatest (TODO: not sure if this is actually the best thing to do)
                    }
                }
                else if (ii["default"]) { // If nothing was supplied but there's a default value, just use the default
                    args.push(rxjs_1.of(ii["default"]));
                }
                else {
                    args.push(undefined); // Otherwise, just add it as an undefined arg
                }
            });
            return args;
        }));
    };
    /**
     * Get a stream of lists of incoming edges
     */
    Node.prototype.getIncomingEdgesStream = function () { return this.incomingEdges; };
    /**
     * Get a stream of lists of outgoing edges
     */
    Node.prototype.getOutgoingEdgesStream = function () { return this.outgoingEdges; };
    /**
     * Add an edge that points to one of this node's input props
     * @param edge The Edge object that points to one of this node's input props
     */
    Node.prototype.addIncomingEdge = function (edge) {
        var ie = this.incomingEdges.getValue();
        var newIncomingEdges = immutability_helper_1["default"](ie, { $push: [edge] });
        this.incomingEdges.next(newIncomingEdges);
    };
    /**
     * Add an edge that points from one of this node's output props
     * @param edge The Edge object that points away from one of this node's output props
     */
    Node.prototype.addOutgoingEdge = function (edge) {
        var oe = this.outgoingEdges.getValue();
        var newOutgoingEdges = immutability_helper_1["default"](oe, { $push: [edge] });
        this.outgoingEdges.next(newOutgoingEdges);
    };
    /**
     * Remove an edge that points at one of the input props
     * @param edge The edge to remove
     */
    Node.prototype.removeIncomingEdge = function (edge) {
        var ie = this.incomingEdges.getValue();
        var i = ie.indexOf(edge);
        if (i >= 0) { // If this edge actually belongs to this node...
            // Create a new list of edges that has edge removed (using op that does not mutate the actual array)
            var newIncomingEdges = immutability_helper_1["default"](ie, { $splice: [[i, 1]] });
            // Set my incoming edges list to that array without edge
            this.incomingEdges.next(newIncomingEdges);
        }
    };
    /**
     * Remove an edge that leaves from one of the output props
     * @param edge The edge to remove
     */
    Node.prototype.removeOutgoingEdge = function (edge) {
        var oe = this.outgoingEdges.getValue();
        var i = oe.indexOf(edge);
        if (i >= 0) { // If this edge actually belongs to this node...
            // Create a new list of edges that has edge removed (using op that does not mutate the actual array)
            var newOutgoingEdges = immutability_helper_1["default"](oe, { $splice: [[i, 1]] });
            // Set my outgoing edges list to that array without edge
            this.outgoingEdges.next(newOutgoingEdges);
        }
    };
    /**
     * Clean up after this node gets removed from a scene
     */
    Node.prototype.remove = function () {
        this.incomingEdges.complete();
        this.outgoingEdges.complete();
        this.layout.complete();
    };
    ;
    /**
     * Get a stream with values of a given output property
     * @param prop The name of the output property we are interested in
     */
    Node.prototype.pluckOutput = function (prop) {
        if (prop === void 0) { prop = exports.PROP_DEFAULT_NAME; }
        var outputStream = this.getOutputStream();
        return outputStream.pipe(operators_1.pluck(prop));
    };
    /**
     * Get this node's unique ID
     */
    Node.prototype.getID = function () { return "node-" + this.id; };
    Node.nodeCount = 1; // How many nodes are there (used for getting unique IDs)
    return Node;
}());
exports.Node = Node;
/**
 * A node that represents a constant value
 */
var ConstantNode = /** @class */ (function (_super) {
    __extends(ConstantNode, _super);
    function ConstantNode(value, outputInfo) {
        var _a;
        if (outputInfo === void 0) { outputInfo = { name: exports.PROP_DEFAULT_NAME }; }
        var _this = _super.call(this, "" + value) || this;
        _this.inputInfoStream = rxjs_1.of([]); // There are no inputs to a constant
        _this.stream = rxjs_1.of((_a = {}, _a[outputInfo.name] = value, _a)); // The output stream
        _this.outputInfoStream = rxjs_1.of([outputInfo]); // There is typically one output with the default name
        _this.establishInputStream(); // (defined by superclass)
        return _this;
    }
    ConstantNode.prototype.getOutputStream = function () { return this.stream; };
    ;
    ConstantNode.prototype.getInputInfoStream = function () { return this.inputInfoStream; };
    ;
    ConstantNode.prototype.getOutputInfoStream = function () { return this.outputInfoStream; };
    ;
    return ConstantNode;
}(Node));
exports.ConstantNode = ConstantNode;
/**
 * A superclass that represents any node where the input and output info does *not* change over time (should be  most Nodes)
 */
var StaticInfoNode = /** @class */ (function (_super) {
    __extends(StaticInfoNode, _super);
    function StaticInfoNode(label, inputs, output) {
        var _this = _super.call(this, label) || this;
        _this.inputInfoStream = rxjs_1.of(inputs); // Input info is a constant value, so use of
        _this.outputInfoStream = rxjs_1.of(output); // Output info is a constant value, so use of
        _this.establishInputStream(); // From the superclass
        return _this;
    }
    StaticInfoNode.prototype.getOutputStream = function () { return this.managedOut; };
    StaticInfoNode.prototype.getInputInfoStream = function () { return this.inputInfoStream; };
    StaticInfoNode.prototype.getOutputInfoStream = function () { return this.outputInfoStream; };
    /**
     * Create an output stream that handles 'raw' output attributes
     */
    StaticInfoNode.prototype.establishOutputStream = function () {
        // We need the outputInfo stream to know what should be raw
        var outputInfoStream = this.getOutputInfoStream();
        // Combine the actual output and information about the output into one stream
        var outputAndInfo = rxjs_1.combineLatest(this.out, outputInfoStream);
        this.managedOut = outputAndInfo.pipe(operators_1.mergeMap(function (_a) {
            //OutValue is an object (keys are strings and values are streams)
            var outValue = _a[0], outputInfo = _a[1];
            //The list of properties that are marked as raw
            var rawProps = new Set(outputInfo.filter(function (oi) { return oi.raw; }).map(function (oi) { return oi.name; }));
            // Decompose the output object into a list of streams with individual properties
            // For example: A stream with value Observable({a: 1, b: 2}) becomes [Observable({a: 1}), Observable({b: 2})]
            var individualDictStreams = Object.keys(outValue).map(function (key) {
                var _a;
                var val = outValue[key];
                if (rawProps.has(key) && rxjs_1.isObservable(val)) {
                    // If we're supposed to output the raw stream, just pipe the stream's value into this propertie's stream
                    return val.pipe(operators_1.map(function (v) {
                        var _a;
                        return (_a = {}, _a[key] = v, _a);
                    }));
                }
                else {
                    // Otherwise, just return a stream with a static value
                    return rxjs_1.of((_a = {}, _a[key] = val, _a));
                }
            });
            // Combine all of the property streams back into one object (now, the raw values have been handled)
            return rxjs_1.combineLatest.apply(void 0, individualDictStreams).pipe(operators_1.map(function (val) {
                return Object.assign.apply(Object, [{}].concat(val));
            }));
        }));
    };
    return StaticInfoNode;
}(Node));
/**
 * Represents a node that is a single operation (static information, any number of inputs, one output)
 */
var OpNode = /** @class */ (function (_super) {
    __extends(OpNode, _super);
    function OpNode(label, func, inputs, output) {
        var _this = _super.call(this, label, inputs, [output]) || this;
        _this.func = func;
        _this.establishInputStream();
        // this.inputStream: a stream of (arrays of (streams of arg values) )
        //   x: (1---2--3) -\
        //                   >-- (+)
        //   y: (5---6---) -/
        // this.inputStream: Stream( [ Stream(1,2,3), Stream(5,6) ] )
        _this.out = _this.inputStream.pipe(operators_1.mergeMap(function (args) {
            // args is an array of streams
            return rxjs_1.combineLatest.apply(void 0, args);
        }), operators_1.map(function (argValues) {
            var _a;
            return (_a = {}, _a[output.name] = _this.func.apply(_this, argValues), _a);
        } //argValues is an array of arg values
        ));
        _this.establishOutputStream();
        return _this;
    }
    return OpNode;
}(StaticInfoNode));
exports.OpNode = OpNode;
/**
 * A node that generates random numbers at an interval
 */
var GenNode = /** @class */ (function (_super) {
    __extends(GenNode, _super);
    function GenNode(name) {
        if (name === void 0) { name = 'gen'; }
        var _this = _super.call(this, name, [{
                name: 'delay' // one input for delay between generations
            }], [{
                name: exports.PROP_DEFAULT_NAME // one putput with the random number
            }]) || this;
        _this.intervalID = -1; // The ID of the JavaScript timer
        _this.out = new rxjs_1.BehaviorSubject(_this.getRandom()); // The output starts with a random value
        _this.subscription = _this.inputStream.pipe(operators_1.map(function (inp) {
            return rxjs_1.combineLatest.apply(void 0, inp);
        })).pipe(operators_1.mergeMap(function (args) {
            //  Take the value of the first arg
            return args.pipe(operators_1.map(function (args) {
                return args[0];
            }));
        })).subscribe({
            next: function (delay) {
                //  delay is the current delay between random number generations
                _this.clear(); // clear any existing timer
                _this.set(delay); // and set a new timer
            }
        });
        _this.establishOutputStream();
        return _this;
    }
    /**
     * Clear any set timer for generating a new number
     */
    GenNode.prototype.clear = function () {
        if (this.intervalID >= 0) {
            clearInterval(this.intervalID);
            this.intervalID = -1;
        }
    };
    /**
     * Set a timer for generating a new number
     * @param delay How long to wait before generating a new number
     */
    GenNode.prototype.set = function (delay) {
        var _this = this;
        this.intervalID = setInterval(function () {
            _this.out.next(_this.getRandom());
        }, delay);
    };
    /**
     * Get a new random number
     */
    GenNode.prototype.getRandom = function () {
        var _a;
        return _a = {}, _a[exports.PROP_DEFAULT_NAME] = Math.random(), _a;
    };
    ;
    /**
     * Remove this node from the scene
     */
    GenNode.prototype.remove = function () {
        _super.prototype.remove.call(this);
        this.clear();
        this.out.complete();
        this.subscription.unsubscribe();
    };
    ;
    return GenNode;
}(StaticInfoNode));
exports.GenNode = GenNode;
/**
 * A node that represents a 3D model
 */
var ObjNode = /** @class */ (function (_super) {
    __extends(ObjNode, _super);
    function ObjNode(label, inputs) {
        var _this = this;
        // Initiate outputs using the same info as inputs.
        var outputs = inputs.map(function (input) { return ({ name: input.name, type: input.type, raw: input.raw }); });
        _this = _super.call(this, label, inputs, outputs) || this;
        // Initiate updates using the same info as inputs.
        var updates = inputs.map(function (input) { return ({ name: input.name, value: input["default"], type: input.type, raw: input.raw }); });
        _this.updateInfo = new rxjs_1.BehaviorSubject(updates);
        var inputsAndUpdates = rxjs_1.combineLatest(_this.inputStream.pipe(operators_1.switchMap(function (args) {
            return rxjs_1.combineLatest.apply(void 0, args);
        })), _this.updateInfo);
        _this.out = inputsAndUpdates.pipe(operators_1.map(function (_a) {
            // if (label === 'sphere')
            // console.log(`${updates[1].name}, ${updates[1].value}`);
            var argValues = _a[0], updates = _a[1];
            var result = {};
            // Map each output name to the corresponding value.
            outputs.forEach(function (prop, i) {
                if (argValues[i] === inputs[i]["default"])
                    result[prop.name] = updates[i].value;
                else
                    result[prop.name] = argValues[i];
            });
            return result;
        }));
        _this.establishOutputStream();
        return _this;
    }
    ;
    ObjNode.prototype.update = function (name, _value) {
        var latestUpdate = this.updateInfo.getValue();
        for (var i = 0; i < latestUpdate.length; i++) {
            if (latestUpdate[i].name === name) {
                latestUpdate[i].value = _value;
                break;
            }
        }
        // console.log(this.updateInfo.getValue());
        this.updateInfo.next(latestUpdate);
    };
    return ObjNode;
}(StaticInfoNode));
exports.ObjNode = ObjNode;
//# sourceMappingURL=Node.js.map