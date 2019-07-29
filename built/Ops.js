"use strict";
exports.__esModule = true;
var Node_1 = require("./Node");
var operators_1 = require("rxjs/operators");
exports.ops = {
    '+': function () { return new Node_1.OpNode(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return args.reduce(function (pv, cv) { return pv + cv; }, 0);
    }, [{ name: Node_1.PROP_DEFAULT_NAME, rest: true }], { name: Node_1.PROP_DEFAULT_NAME }); },
    '-': function () { return new Node_1.OpNode(function (a, b) {
        return a - b;
    }, [{ name: 'a' }, { name: 'b' }], { name: Node_1.PROP_DEFAULT_NAME }); },
    '*': function () { return new Node_1.OpNode(function (a, b) {
        return a * b;
    }, [{ name: 'a' }, { name: 'b' }], { name: Node_1.PROP_DEFAULT_NAME }); },
    '/': function () { return new Node_1.OpNode(function (a, b) {
        return a / b;
    }, [{ name: 'a' }, { name: 'b' }], { name: Node_1.PROP_DEFAULT_NAME }); },
    'gen': function () { return new Node_1.GenNode(); },
    'take': function () { return new Node_1.OpNode(function (stream, count) {
        console.log(stream, count);
        return stream.pipe(operators_1.take(count));
    }, [{ name: 'stream', raw: true }, { name: 'count' }], { name: Node_1.PROP_DEFAULT_NAME }); }
};
//# sourceMappingURL=Ops.js.map