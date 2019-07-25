"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WrappedObservable_1 = require("./WrappedObservable");
var WrappedOp_1 = require("./WrappedOp");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var ops = {
    '+': {
        args: [{ name: 'nums', rest: true }],
        output: [{ name: 'sum' }],
        fn: function (args) {
            return [args.reduce(function (pv, cv) { return pv + cv; }, 0)];
        }
    }
};
var observables = {
    'gen': {
        args: [],
        output: [{ name: '' }],
        params: [{ name: 'delay' }],
        fn: function (delay) {
            return new rxjs_1.Observable(function (sub) {
                var timeout = null;
                // recursively send a random number to the subscriber
                // after a random delay
                (function push() {
                    timeout = setTimeout(function () {
                        sub.next(Math.random());
                        push();
                    }, delay);
                })();
                // clear any pending timeout on teardown
                return function () { return clearTimeout(timeout); };
            }).pipe(operators_1.startWith(Math.random()));
        }
    },
    'take': {
        args: [],
        output: [{ name: '' }],
        params: [{ name: 'count' }],
        fn: function (count) {
            return operators_1.take(count);
        }
    }
};
;
var Scene = /** @class */ (function () {
    function Scene(state) {
        if (state === void 0) { state = { scene: [] }; }
        this.state = state;
        this.updateScene();
    }
    Scene.prototype.guid = function () { return "id-" + Scene.id_num++; };
    Scene.prototype.addOp = function (op, input) {
        var id = this.guid();
        this.state.scene.push({
            type: 'op',
            id: id, op: op, input: input
        });
        return id;
    };
    Scene.prototype.addConstant = function (value) {
        var id = this.guid();
        this.state.scene.push({
            type: 'constant',
            id: id, value: value
        });
        return id;
    };
    Scene.prototype.addObservable = function (op, parameters, pipe) {
        if (parameters === void 0) { parameters = []; }
        var id = this.guid();
        this.state.scene.push({
            type: 'observable',
            id: id, op: op, parameters: parameters, pipe: pipe
        });
        return id;
    };
    Scene.prototype.updateObs = function (obj) {
        var _a;
        var id = obj.id, type = obj.type;
        if (type === 'constant') {
            var value = obj.value;
            this.wrappedObservables[id] = new WrappedObservable_1.WrappedObservable(rxjs_1.of(value));
        }
        else if (type === 'op') {
            var op = obj.op;
            var opInfo = ops[op];
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
            this.wrappedObservables[id] = wop;
        }
        else if (type === 'observable') {
            var _b = obj, op = _b.op, parameters = _b.parameters;
            var observable = (_a = observables[op]).fn.apply(_a, parameters);
            this.observables[id] = observable;
        }
    };
    Scene.prototype.pipeObservable = function (obs) {
        var id = obs.id, type = obs.type, op = obs.op, pipe = obs.pipe;
        if (pipe) {
            this.wrappedObservables[id] = this.wrappedObservables[pipe].pipe(this.observables[id]);
        }
        else {
            this.wrappedObservables[id] = new WrappedObservable_1.WrappedObservable(this.observables[id]);
        }
    };
    Scene.prototype.updateOpInput = function (op) {
        var _this = this;
        var id = op.id, input = op.input, type = op.type;
        var getInput = function (inp_id) {
            if (inp_id.indexOf('.') >= 0) {
                var _a = inp_id.split('.'), obj_id = _a[0], prop_name = _a[1];
                var observable_1 = _this.wrappedObservables[obj_id].getObservable();
                var propObservable = observable_1.pipe(operators_1.pluck(prop_name));
                return propObservable;
            }
            else {
                return _this.wrappedObservables[inp_id].getObservable();
            }
        };
        var inps = new WrappedObservable_1.WrappedObservable(rxjs_1.combineLatest.apply(void 0, input.map(getInput)));
        var observable = this.wrappedObservables[id];
        observable.setInput(inps);
    };
    Scene.prototype.updateScene = function () {
        var _this = this;
        this.state.scene.forEach(function (obj) { _this.updateObs(obj); });
        this.state.scene.filter(function (o) { return o.type === 'observable'; }).forEach(function (obs) { _this.pipeObservable(obs); });
        this.state.scene.filter(function (o) { return o.type === 'op'; }).forEach(function (op) { _this.updateOpInput(op); });
        this.state.scene.forEach(function (x) {
            var id = x.id;
            _this.wrappedObservables[id].subscribe({
                next: function (x) {
                    console.log(id, 'is now', x);
                }
            });
        });
    };
    Scene.id_num = 0;
    return Scene;
}());
exports.Scene = Scene;
//# sourceMappingURL=Scene.js.map