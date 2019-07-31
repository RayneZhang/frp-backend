"use strict";
exports.__esModule = true;
var Node_1 = require("./Node");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
function createUnaryOpNode(fn, arg1Name) {
    if (arg1Name === void 0) { arg1Name = 'a'; }
    return function () { return new Node_1.OpNode(fn, [{ name: arg1Name }], { name: Node_1.PROP_DEFAULT_NAME }); };
}
function createBinaryOpNode(fn, arg1Name, arg2Name) {
    if (arg1Name === void 0) { arg1Name = 'a'; }
    if (arg2Name === void 0) { arg2Name = 'b'; }
    return function () { return new Node_1.OpNode(fn, [{ name: arg1Name }, { name: arg2Name }], { name: Node_1.PROP_DEFAULT_NAME }); };
}
exports.ops = {
    '+': function () { return new Node_1.OpNode(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return args.reduce(function (pv, cv) { return pv + cv; }, 0);
    }, [{ name: Node_1.PROP_DEFAULT_NAME, rest: true }], { name: Node_1.PROP_DEFAULT_NAME }); },
    '-': function () { return createBinaryOpNode(function (a, b) { return a - b; }); },
    '*': function () { return createBinaryOpNode(function (a, b) { return a * b; }); },
    '/': function () { return createBinaryOpNode(function (a, b) { return a / b; }); },
    '%': function () { return createBinaryOpNode(function (a, b) { return a % b; }); },
    'pow': function () { return createBinaryOpNode(function (a, b) { return Math.pow(a, b); }, 'num', 'exp'); },
    '=': function () { return createBinaryOpNode(function (a, b) { return a == b; }); },
    '>': function () { return createBinaryOpNode(function (a, b) { return a > b; }); },
    '<': function () { return createBinaryOpNode(function (a, b) { return a < b; }); },
    '>=': function () { return createBinaryOpNode(function (a, b) { return a >= b; }); },
    '<=': function () { return createBinaryOpNode(function (a, b) { return a <= b; }); },
    'and': function () { return createBinaryOpNode(function (a, b) { return a && b; }); },
    'or': function () { return createBinaryOpNode(function (a, b) { return a || b; }); },
    'neg': function () { return createUnaryOpNode(function (a) { return -a; }); },
    'not': function () { return createUnaryOpNode(function (a) { return !a; }); },
    'abs': function () { return createUnaryOpNode(function (a) { return Math.abs(a); }); },
    'round': function () { return createUnaryOpNode(function (a) { return Math.round(a); }); },
    'gen': function () { return new Node_1.GenNode(); },
    'take': function () { return new Node_1.OpNode(function (stream, count) {
        return stream.pipe(operators_1.take(count));
    }, [{ name: 'stream', raw: true }, { name: 'count' }], { name: Node_1.PROP_DEFAULT_NAME, raw: true }); },
    'interval': function () { return new Node_1.OpNode(function (period) {
        return rxjs_1.interval(period);
    }, [{ name: 'period' }], { name: Node_1.PROP_DEFAULT_NAME, raw: true }); },
    'delay': function () { return new Node_1.OpNode(function (stream, d) {
        return stream.pipe(operators_1.delay(d));
    }, [{ name: 'stream', raw: true }, { name: 'delay' }], { name: Node_1.PROP_DEFAULT_NAME, raw: true }); }
};
//# sourceMappingURL=Ops.js.map