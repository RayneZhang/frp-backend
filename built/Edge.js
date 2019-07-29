"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var Edge = /** @class */ (function () {
    function Edge(f, t) {
        this.f = f;
        this.t = t;
        this.fromStream = new rxjs_1.ReplaySubject();
        this.setFrom(f);
        this.setTo(t);
        this.valueStream = this.fromStream.pipe(operators_1.switchMap(function (stream) {
            return stream;
        }));
        // this.valueStream.subscribe({
        //     next: (v) => {
        //     console.log(v);
        // }})
    }
    Edge.prototype.getFrom = function () { return this.f; };
    Edge.prototype.getTo = function () { return this.t; };
    Edge.prototype.setFrom = function (f) {
        this.f = f;
        var _a = this.getFrom(), node = _a.node, prop = _a.prop;
        this.fromStream.next(node.pluckOutput(prop));
    };
    Edge.prototype.setTo = function (t) {
        this.t = t;
    };
    Edge.prototype.getStream = function () {
        return this.valueStream;
    };
    return Edge;
}());
exports.Edge = Edge;
//# sourceMappingURL=Edge.js.map