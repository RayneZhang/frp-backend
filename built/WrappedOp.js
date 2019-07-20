"use strict";
exports.__esModule = true;
var WrappedSignal_1 = require("./WrappedSignal");
var operators_1 = require("rxjs/operators");
var WrappedOp = /** @class */ (function () {
    function WrappedOp(func) {
        this.func = func;
        this.output = new WrappedSignal_1.WrappedSignal();
    }
    WrappedOp.prototype.setInput = function (i) {
        this.input = i;
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.output = this.input.pipe(operators_1.map(this.func));
        // (i: Observable<I>): Observable<O> => {
        //     return map
        //     console.log(i);
        //     const subscription = i.subscribe({
        //         next: (inp: I): O => {
        //             return this.func(inp);
        //         }
        //     });
        //     return null;
        // });
    };
    WrappedOp.prototype.getOutput = function () {
        return this.output;
    };
    return WrappedOp;
}());
exports.WrappedOp = WrappedOp;
