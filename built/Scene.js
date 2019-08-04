"use strict";
exports.__esModule = true;
var Edge_1 = require("./Edge");
var Node_1 = require("./Node");
var Ops_1 = require("./Ops");
var rxjs_1 = require("rxjs");
var immutability_helper_1 = require("immutability-helper");
var SceneLayout_1 = require("./SceneLayout");
var Scene = /** @class */ (function () {
    function Scene() {
        this.nodesStream = new rxjs_1.BehaviorSubject([]);
        this.edgesStream = new rxjs_1.BehaviorSubject([]);
        this.layoutStream = SceneLayout_1.getLayoutStream(this.getNodesStream(), this.getEdgesStream());
        rxjs_1.combineLatest(this.layoutStream, this.getNodesStream(), this.getEdgesStream()).subscribe(function (_a) {
            var layout = _a[0], nodes = _a[1], edges = _a[2];
            nodes.forEach(function (node) {
                var id = node.getID();
                if (layout.nodes[id]) {
                    node.setLayout(layout.nodes[id]);
                }
            });
            edges.forEach(function (edge) {
                var id = edge.getID();
                if (layout.edges[id]) {
                    edge.setLayout(layout.edges[id]);
                }
            });
        });
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
        var nodesValue = this.nodesStream.getValue();
        var newNodes = immutability_helper_1["default"](nodesValue, { $push: [node] });
        this.nodesStream.next(newNodes);
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
        var edgesValue = this.edgesStream.getValue();
        var newEdges = immutability_helper_1["default"](edgesValue, { $push: [edge] });
        this.edgesStream.next(newEdges);
        return edge;
    };
    Scene.prototype.removeEdge = function (edge) {
        var from = edge.getFrom();
        var to = edge.getTo();
        from.node.removeOutgoingEdge(edge);
        to.node.removeIncomingEdge(edge);
        var edgesValue = this.edgesStream.getValue();
        var index = edgesValue.indexOf(edge);
        if (index >= 0) {
            var newEdges = immutability_helper_1["default"](edgesValue, { $splice: [[index, 1]] });
            this.edgesStream.next(newEdges);
        }
    };
    Scene.prototype.removeNode = function (node) {
        var nodesValue = this.nodesStream.getValue();
        var index = nodesValue.indexOf(node);
        if (index >= 0) {
            var newNodes = immutability_helper_1["default"](nodesValue, { $splice: [[index, 1]] });
            this.nodesStream.next(newNodes);
        }
    };
    Scene.prototype.getNodesStream = function () { return this.nodesStream; };
    Scene.prototype.getEdgesStream = function () { return this.edgesStream; };
    return Scene;
}());
exports.Scene = Scene;
//# sourceMappingURL=Scene.js.map