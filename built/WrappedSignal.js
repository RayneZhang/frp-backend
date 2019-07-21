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
var rxjs_1 = require("rxjs");
var WrappedObservable_1 = require("./WrappedObservable");
var WrappedSignal = /** @class */ (function (_super) {
    __extends(WrappedSignal, _super);
    function WrappedSignal(value) {
        return _super.call(this, new rxjs_1.BehaviorSubject(value)) || this;
    }
    WrappedSignal.prototype.next = function (value) { this.observable.next(value); };
    WrappedSignal.prototype.error = function (err) { this.observable.error(err); };
    WrappedSignal.prototype.complete = function () { this.observable.complete(); };
    WrappedSignal.prototype.getValue = function () {
        return this.observable.getValue();
    };
    return WrappedSignal;
}(WrappedObservable_1.WrappedObservable));
exports.WrappedSignal = WrappedSignal;
