"use strict";
exports.__esModule = true;
var Node_1 = require("./Node");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var _1 = require(".");
// unary ops accept *one* arguments
function createUnaryOpNode(name, fn, arg1Name) {
    if (arg1Name === void 0) { arg1Name = 'a'; }
    return function () { return new Node_1.OpNode(name, fn, [{ name: arg1Name }], { name: Node_1.PROP_DEFAULT_NAME }); };
}
// binary ops accept *two* arguments
function createBinaryOpNode(name, fn, arg1Name, arg2Name) {
    if (arg1Name === void 0) { arg1Name = 'a'; }
    if (arg2Name === void 0) { arg2Name = 'b'; }
    return function () { return new Node_1.OpNode(name, fn, [{ name: arg1Name }, { name: arg2Name }], { name: Node_1.PROP_DEFAULT_NAME }); };
}
exports.ops = {
    '+': function () { return new Node_1.OpNode('+', function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return args.reduce(function (pv, cv) { return pv + cv; }, 0);
    }, [{ name: Node_1.PROP_DEFAULT_NAME, rest: true }], { name: Node_1.PROP_DEFAULT_NAME }); },
    '-': function () { return createBinaryOpNode('-', function (a, b) { return a - b; }); },
    '*': function () { return createBinaryOpNode('*', function (a, b) { return a * b; }); },
    '/': function () { return createBinaryOpNode('/', function (a, b) { return a / b; }); },
    '%': function () { return createBinaryOpNode('%', function (a, b) { return a % b; }); },
    'pow': function () { return createBinaryOpNode('pow', function (a, b) { return Math.pow(a, b); }, 'num', 'exp'); },
    '==': function () { return createBinaryOpNode('==', function (a, b) { return a == b; }); },
    '>': function () { return createBinaryOpNode('>', function (a, b) { return a > b; }); },
    '<': function () { return createBinaryOpNode('<', function (a, b) { return a < b; }); },
    '>=': function () { return createBinaryOpNode('>=', function (a, b) { return a >= b; }); },
    '<=': function () { return createBinaryOpNode('<=', function (a, b) { return a <= b; }); },
    'and': function () { return createBinaryOpNode('and', function (a, b) { return a && b; }); },
    'or': function () { return createBinaryOpNode('or', function (a, b) { return a || b; }); },
    'neg': function () { return createUnaryOpNode('neg', function (a) { return -a; }); },
    'not': function () { return createUnaryOpNode('not', function (a) { return !a; }); },
    'abs': function () { return createUnaryOpNode('abs', function (a) { return Math.abs(a); }); },
    'round': function () { return createUnaryOpNode('round', function (a) { return Math.round(a); }); },
    'gen': function () { return new Node_1.GenNode(); },
    'take': function () { return new Node_1.OpNode('take', function (stream, count) {
        return stream.pipe(operators_1.take(count));
    }, [{ name: 'stream', raw: true }, { name: 'count' }], { name: Node_1.PROP_DEFAULT_NAME, raw: true }); },
    'interval': function () { return new Node_1.OpNode('interval', function (period) {
        return rxjs_1.interval(period);
    }, [{ name: 'period' }], { name: Node_1.PROP_DEFAULT_NAME, raw: true }); },
    'delay': function () { return new Node_1.OpNode('delay', function (stream, d) {
        return stream.pipe(operators_1.delay(d));
    }, [{ name: 'stream', raw: true }, { name: 'delay' }], { name: Node_1.PROP_DEFAULT_NAME, raw: true }); },
    'snapshot': function () { return new Node_1.OpNode('snapshot', function (signal, event) {
        return event.pipe(operators_1.mergeMap(function () {
            return signal.pipe(operators_1.take(1));
        }));
    }, [{ name: 'signal', raw: true }, { name: 'event', raw: true }], { name: 'output', raw: true }); },
    'create': function () { return new Node_1.OpNode('create', function (object, position) {
        return position.pipe(operators_1.mergeMap(function (pos) {
            return object.pipe(operators_1.take(1), operators_1.map(function (objName) {
                var createdNode = _1.scene.addObj(objName, [{ name: 'object', "default": "node-" + Node_1.Node.getNodeCount() }, { name: 'position', "default": pos }]);
                return createdNode.getID();
            }));
        }));
    }, [{ name: 'object', raw: true }, { name: 'position', raw: true }], { name: 'object', raw: true }); },
    'translate': function () { return new Node_1.OpNode('translate', function (object, from, to, speed) {
        return new rxjs_1.BehaviorSubject(false);
    }, [{ name: 'object', raw: true }, { name: 'from', raw: true }, { name: 'to', raw: true }, { name: 'speed', raw: true, "default": 1 }], { name: 'end', raw: true }); }
};
//# sourceMappingURL=Ops.js.map