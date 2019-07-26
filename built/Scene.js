"use strict";
exports.__esModule = true;
var WrappedObservable_1 = require("./WrappedObservable");
var WrappedOp_1 = require("./WrappedOp");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var Ops_1 = require("./Ops");
;
var SceneOp = /** @class */ (function () {
    function SceneOp() {
    }
    return SceneOp;
}());
exports.SceneOp = SceneOp;
var SceneEdge = /** @class */ (function () {
    function SceneEdge() {
    }
    return SceneEdge;
}());
exports.SceneEdge = SceneEdge;
var Scene = /** @class */ (function () {
    // { [id: string]: Observable<any> } = {};
    function Scene(state) {
        if (state === void 0) { state = { scene: [] }; }
        this.state = state;
        this.wrappedObservables = new Map();
        // { [id: string]: WrappedObservable<any> } = {};
        this.observables = new Map();
        this.updateScene();
    }
    Scene.prototype.guid = function () { return "id-" + Scene.id_num++; };
    Scene.prototype["delete"] = function (id) {
    };
    Scene.prototype.addOp = function (op, input) {
        if (input === void 0) { input = []; }
        var id = this.guid();
        var opValue = {
            type: 'op',
            id: id, op: op, input: input
        };
        this.state.scene.push(opValue);
        this.updateObs(opValue);
        this.updateOpInput(opValue);
        this.subscribeToObservable(opValue);
        return id;
    };
    Scene.prototype.addConstant = function (value) {
        var id = this.guid();
        var constantVal = {
            type: 'constant',
            id: id, value: value
        };
        this.state.scene.push(constantVal);
        this.updateObs(constantVal);
        this.subscribeToObservable(constantVal);
        return id;
    };
    Scene.prototype.addObservable = function (op, parameters, pipe) {
        if (parameters === void 0) { parameters = []; }
        var id = this.guid();
        var observableVal = {
            type: 'observable',
            id: id, op: op, parameters: parameters, pipe: pipe
        };
        this.state.scene.push(observableVal);
        this.updateObs(observableVal);
        this.pipeObservable(observableVal);
        this.subscribeToObservable(observableVal);
        return id;
    };
    Scene.prototype.updateObs = function (obj) {
        var id = obj.id, type = obj.type;
        if (type === 'constant') {
            var value = obj.value;
            this.wrappedObservables.set(id, new WrappedObservable_1.WrappedObservable(rxjs_1.of(value)));
        }
        else if (type === 'op') {
            var op = obj.op;
            var opInfo = Ops_1.ops[op];
            if (!opInfo) {
                throw new Error('No op ' + op);
            }
            var fn_1 = opInfo.fn, output = opInfo.output;
            var outputNames_1 = output.map(function (o) { return o.name; });
            var mappedOutputs = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var result = fn_1.apply(void 0, args);
                var rv = {};
                result.forEach(function (r, i) {
                    rv[outputNames_1[i]] = r;
                });
                return rv;
            };
            var wop = new WrappedOp_1.WrappedOp(mappedOutputs);
            this.wrappedObservables.set(id, wop);
        }
        else if (type === 'observable') {
            var _a = obj, op = _a.op, parameters_1 = _a.parameters;
            var _b = Ops_1.observables[op], fn = _b.fn, params = _b.params;
            var ps = params.map(function (p, i) {
                var def = p["default"];
                var optional = p.optional;
                if (parameters_1.length > i) {
                    return parameters_1[i];
                }
                else if (def) {
                    return def;
                }
                else if (optional) {
                    return null;
                }
                else {
                    throw new Error();
                }
            });
            var observable = fn.apply(void 0, ps);
            this.observables.set(id, observable);
        }
    };
    Scene.prototype.pipeObservable = function (obs) {
        var id = obs.id, type = obs.type, op = obs.op, pipe = obs.pipe;
        var observable = this.observables.get(id);
        if (pipe) {
            var wrappedObservable = this.wrappedObservables.get(pipe);
            this.wrappedObservables.set(id, wrappedObservable.pipe(observable));
        }
        else {
            this.wrappedObservables.set(id, new WrappedObservable_1.WrappedObservable(observable));
        }
    };
    Scene.prototype.updateOpInput = function (op) {
        var _this = this;
        var id = op.id, input = op.input, type = op.type;
        var getInput = function (inp_id) {
            if (inp_id.indexOf('.') >= 0) {
                var _a = inp_id.split('.'), obj_id = _a[0], prop_name = _a[1];
                var observable_1 = _this.wrappedObservables.get(obj_id).getObservable();
                var propObservable = observable_1.pipe(operators_1.pluck(prop_name));
                return propObservable;
            }
            else {
                return _this.wrappedObservables.get(inp_id).getObservable();
            }
        };
        var inps = new WrappedObservable_1.WrappedObservable(rxjs_1.combineLatest.apply(void 0, input.map(getInput)));
        var observable = this.wrappedObservables.get(id);
        observable.setInput(inps);
    };
    Scene.prototype.subscribeToObservable = function (obs) {
        var id = obs.id;
        this.wrappedObservables.get(id).subscribe({
            next: function (x) {
                console.log(id, 'is now', x);
            }
        });
    };
    ;
    Scene.prototype.updateScene = function () {
        var _this = this;
        this.state.scene.forEach(function (obj) { _this.updateObs(obj); });
        this.state.scene.filter(function (o) { return o.type === 'observable'; }).forEach(function (obs) { _this.pipeObservable(obs); });
        this.state.scene.filter(function (o) { return o.type === 'op'; }).forEach(function (op) { _this.updateOpInput(op); });
        this.state.scene.forEach(function (o) { _this.subscribeToObservable(o); });
    };
    Scene.id_num = 0;
    return Scene;
}());
exports.Scene = Scene;
/* API for recording data dependencies
Drawing an edge represents the dependency between the two objects.
Want a list of all of the edges (source and target for every edge).

Source and target objects should have attributes....edge between a cube and sphere, which attribute is it connecting?

Adding edges into the state of the system, would be useful for modifying or deleting an edge


Every edge will have a unique id
Edges should be represented in a class

Operations/everything should be their own object
*/ 
//# sourceMappingURL=Scene.js.map