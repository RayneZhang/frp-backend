"use strict";
exports.__esModule = true;
var WrappedObservable = /** @class */ (function () {
    function WrappedObservable(observable) {
        this.observable = observable;
    }
    WrappedObservable.prototype.subscribe = function (_a) {
        var next = _a.next, error = _a.error, complete = _a.complete;
        var observer = { next: next, error: error, complete: complete };
        return this.observable.subscribe(observer);
    };
    WrappedObservable.prototype.pipe = function (func) {
        return new WrappedObservable(this.observable.pipe(func));
    };
    WrappedObservable.prototype.getObservable = function () {
        return this.observable;
    };
    return WrappedObservable;
}());
exports.WrappedObservable = WrappedObservable;
//# sourceMappingURL=WrappedObservable.js.map