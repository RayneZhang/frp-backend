"use strict";
exports.__esModule = true;
var Edge_1 = require("./Edge");
var Node_1 = require("./Node");
var Ops_1 = require("./Ops");
var Scene = /** @class */ (function () {
    function Scene() {
        this.nodes = new Set();
    }
    Scene.prototype.addConstant = function (value) {
        var node = new Node_1.ConstantNode(value);
        this.addNode(node);
        return node;
    };
    Scene.prototype.addOp = function (name) {
        var opFn = Ops_1.ops[name];
        var op = opFn();
        this.addNode(op);
        return op;
    };
    Scene.prototype.addNode = function (node) {
        this.nodes.add(node);
    };
    Scene.prototype.addEdge = function (from, to) {
        if (from instanceof Node_1.Node) {
            from = { node: from, prop: Node_1.PROP_DEFAULT_NAME };
        }
        if (to instanceof Node_1.Node) {
            to = { node: to, prop: Node_1.PROP_DEFAULT_NAME };
        }
        var edge = new Edge_1.Edge(from, to);
        from.node.addOutgoingEdge(edge);
        to.node.addIncomingEdge(edge);
        return edge;
    };
    Scene.prototype.removeEdge = function (edge) {
        var from = edge.getFrom();
        var to = edge.getTo();
        from.node.removeOutgoingEdge(edge);
        to.node.removeIncomingEdge(edge);
    };
    Scene.prototype.removeNode = function (node) {
        this.nodes["delete"](node);
    };
    return Scene;
}());
exports.Scene = Scene;
//# sourceMappingURL=Scene.js.map