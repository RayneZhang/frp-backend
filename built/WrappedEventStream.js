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
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var WrappedObservable_1 = require("./WrappedObservable");
var WrappedEventStreamSource = /** @class */ (function (_super) {
    __extends(WrappedEventStreamSource, _super);
    function WrappedEventStreamSource() {
        return _super.call(this, new rxjs_1.Subject()) || this;
    }
    WrappedEventStreamSource.prototype.error = function (e) { this.observable.error(e); };
    WrappedEventStreamSource.prototype.complete = function () { this.observable.complete(); };
    WrappedEventStreamSource.prototype.next = function (e) { this.observable.next(e); };
    return WrappedEventStreamSource;
}(WrappedObservable_1.WrappedObservable));
exports.WrappedEventStreamSource = WrappedEventStreamSource;
//# sourceMappingURL=WrappedEventStream.js.map