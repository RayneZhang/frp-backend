"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
/**
 * An Edge instance represents directed data flow between two node properties.
 * Every Edge instance keeps track of its current value (through valueStream)
 */
var Edge = /** @class */ (function () {
    function Edge(f, t) {
        this.f = f;
        this.t = t;
        this.layout = new rxjs_1.BehaviorSubject([]);
        // A stream that tracks which location this edge originates from
        // fromStream is a stream where every item is a Loc instance. every time
        // this edge's `from` property is changed, a new Loc gets pushed onto the end
        // of fromStream
        this.fromStream = new rxjs_1.ReplaySubject();
        // A stream that tracks the *current value* of this edge (which depends on where it originates from)
        // it does this by:
        //     1) converting every item in fromStream into a stream of that node's current values (the first map call)
        //     2) "flattening" (through switchMap) each of those streams to produce one stream of current values
        this.valueStream = this.fromStream.pipe(operators_1.map(function (from) {
            var node = from.node, prop = from.prop;
            return node.pluckOutput(prop);
        }), operators_1.switchMap(function (stream) {
            return stream;
        }));
        this.setFrom(f);
        this.setTo(t);
        this.id = Edge.edgeCount++;
    }
    Edge.prototype.getLayoutStream = function () {
        return this.layout;
    };
    Edge.prototype.setLayout = function (l) {
        this.layout.next(l);
    };
    /**
     * Return the node and property that this edge originates from
     */
    Edge.prototype.getFrom = function () { return this.f; };
    /**
     * Return the node and property that this edge goes to
     */
    Edge.prototype.getTo = function () { return this.t; };
    /**
     * Change where this edge originates from
     * @param f - The new origin for this Edge
     */
    Edge.prototype.setFrom = function (f) {
        this.f = f;
        this.fromStream.next(f);
    };
    /**
     * Change where this edge leads to
     * @param t The new destination
     */
    Edge.prototype.setTo = function (t) {
        this.t = t;
    };
    /**
     * Get an Observable stream of this edge's values
     */
    Edge.prototype.getStream = function () {
        return this.valueStream;
    };
    Edge.prototype.getFromIDString = function () {
        var _a = this.getFrom(), node = _a.node, prop = _a.prop;
        return Edge.getPropIDString(node, prop, false);
    };
    Edge.prototype.getToIDString = function () {
        var _a = this.getTo(), node = _a.node, prop = _a.prop;
        return Edge.getPropIDString(node, prop, true);
    };
    Edge.prototype.getID = function () { return "" + this.id; };
    Edge.getPropIDString = function (node, prop, incoming) {
        return node.getIDString() + "." + (incoming ? 'in' : 'out') + "." + prop;
    };
    Edge.edgeCount = 1;
    return Edge;
}());
exports.Edge = Edge;
//# sourceMappingURL=Edge.js.map