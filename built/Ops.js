"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
exports.ops = {
    '+': {
        args: [{ name: 'nums', rest: true }],
        output: [{ name: 'sum' }],
        fn: function (args) {
            return [args.reduce(function (pv, cv) { return pv + cv; }, 0)];
        }
    }
};
exports.observables = {
    'gen': {
        args: [],
        output: [{ name: '' }],
        params: [{ name: 'delay', "default": 5 }],
        fn: function (delay) {
            var bs = new rxjs_1.ReplaySubject(Math.random());
            var interval = setInterval(function () {
                var val = Math.random();
                // console.log(val);
                bs.next(val);
            }, delay);
            return bs;
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
//# sourceMappingURL=Ops.js.map