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
var WrappedObservable_1 = require("./WrappedObservable");
var rxjs_1 = require("rxjs");
var WrappedOp = /** @class */ (function (_super) {
    __extends(WrappedOp, _super);
    function WrappedOp(func, initialValue) {
        if (initialValue === void 0) { initialValue = WrappedOp.NO_OUT; }
        var _this = _super.call(this, new rxjs_1.ReplaySubject(initialValue)) || this;
        _this.func = func;
        return _this;
    }
    WrappedOp.prototype.setInput = function (inputs) {
        var _this = this;
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.subscription = inputs.subscribe({
            next: function (e) {
                _this.observable.next(_this.func(e));
            },
            error: function (err) {
                _this.observable.error(err);
            }
        });
    };
    WrappedOp.prototype.complete = function () {
        this.observable.complete();
    };
    WrappedOp.NO_OUT = null;
    return WrappedOp;
}(WrappedObservable_1.WrappedObservable));
exports.WrappedOp = WrappedOp;
//# sourceMappingURL=WrappedOp.js.map