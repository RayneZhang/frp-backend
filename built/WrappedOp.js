"use strict";
exports.__esModule = true;
var WrappedSignal_1 = require("./WrappedSignal");
var WrappedOp = /** @class */ (function () {
    function WrappedOp(func) {
        this.func = func;
        this.output = new WrappedSignal_1.WrappedSignal();
    }
    WrappedOp.prototype.setInput = function (i) {
        var _this = this;
        this.input = i;
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.subscription = this.input.subscribe({
            next: function (e) {
                _this.output.next(_this.func(e));
            },
            error: function (err) {
                _this.output.error(err);
            }
        });
    };
    WrappedOp.prototype.getOutput = function () {
        return this.output;
    };
    return WrappedOp;
}());
exports.WrappedOp = WrappedOp;
