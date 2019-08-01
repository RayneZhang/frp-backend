"use strict";
exports.__esModule = true;
var Edge_1 = require("./Edge");
var Node_1 = require("./Node");
var Ops_1 = require("./Ops");
var dagre = require("dagre");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var immutability_helper_1 = require("immutability-helper");
var lodash_1 = require("lodash");
var Scene = /** @class */ (function () {
    function Scene() {
        this.nodes = new Map();
        this.edges = new Map();
        this.nodeGraph = new dagre.graphlib.Graph();
        this.edgeGraph = new dagre.graphlib.Graph();
        this.nodesStream = new rxjs_1.BehaviorSubject([]);
        this.edgesStream = new rxjs_1.BehaviorSubject([]);
        this.nodeGraph.setGraph({ rankdir: 'LR' });
        this.nodeGraph.setDefaultEdgeLabel(function () { return ({}); });
        this.edgeGraph.setGraph({ rankdir: 'LR' });
        this.edgeGraph.setDefaultEdgeLabel(function () { return ({}); });
        this.establishLayoutStream();
    }
    Scene.prototype.establishLayoutStream = function () {
        var _this = this;
        var upd = this.nodesStream.pipe(operators_1.mergeMap(function (nodes) {
            return rxjs_1.combineLatest.apply(void 0, nodes.map(function (node) {
                var ioInfoStream = rxjs_1.combineLatest(rxjs_1.of(node), node.getInputInfoStream(), node.getOutputInfoStream(), node.getIncomingEdgesStream(), node.getOutgoingEdgesStream());
                return ioInfoStream;
            }));
        }), operators_1.map(function (nodes) {
            var layout = {
                nodes: {},
                edges: {}
            };
            nodes.forEach(function (_a) {
                var node = _a[0], inputInfo = _a[1], outputInfo = _a[2], incomingEdges = _a[3], outgoingEdges = _a[4];
                var nodeID = node.getIDString();
                var _b = Scene.computeNodeDimensions(inputInfo, outputInfo), width = _b.width, height = _b.height;
                var nodeObj = _this.nodeGraph.node(nodeID);
                nodeObj.width = width;
                nodeObj.height = height;
            });
            dagre.layout(_this.nodeGraph);
            _this.nodeGraph.nodes().forEach(function (nodeID) {
                var node = _this.nodeGraph.node(nodeID);
                layout.nodes[nodeID] = immutability_helper_1["default"](node, { inputs: { $set: {} }, outputs: { $set: {} } });
            });
            nodes.forEach(function (_a) {
                var node = _a[0], inputInfo = _a[1], outputInfo = _a[2], incomingEdges = _a[3], outgoingEdges = _a[4];
                var nodeID = node.getIDString();
                var nodeObj = _this.nodeGraph.node(nodeID);
                var leftEdgeX = nodeObj.x;
                var rightEdgeX = leftEdgeX + nodeObj.width;
                var startY = nodeObj.y + Scene.MINIMUM_DIMENSIONS.height / 2;
                var x = leftEdgeX;
                var y = startY;
                inputInfo.forEach(function (ii) {
                    var toID = Edge_1.Edge.getPropIDString(node, ii.name, true);
                    if (_this.edgeGraph.hasNode(toID)) {
                        var toIDEdgeObj = _this.edgeGraph.node(toID);
                        toIDEdgeObj.x = x;
                        toIDEdgeObj.y = y;
                    }
                    layout.nodes[nodeID].inputs[ii.name] = { x: x, y: y };
                    y += Scene.HEIGHT_PER_PROPERTY;
                });
                x = rightEdgeX;
                y = startY;
                outputInfo.forEach(function (oi) {
                    var fromID = Edge_1.Edge.getPropIDString(node, oi.name, false);
                    if (_this.edgeGraph.hasNode(fromID)) {
                        console.log('HAS');
                        var fromIDEdgeObj = _this.edgeGraph.node(fromID);
                        fromIDEdgeObj.x = x;
                        fromIDEdgeObj.y = y;
                    }
                    layout.nodes[nodeID].outputs[oi.name] = { x: x, y: y };
                    y += Scene.HEIGHT_PER_PROPERTY;
                });
            });
            _this.edgeGraph.nodes().forEach(function (id) {
                var n = _this.edgeGraph.node(id);
                console.log(id);
                console.log(n);
            });
            dagre.layout(_this.edgeGraph);
            _this.edgeGraph.edges().forEach(function (e) {
                var edge = _this.edgeGraph.edge(e);
                var id = edge.id, points = edge.points;
                layout.edges[id] = points;
            });
            return layout;
        }), operators_1.debounceTime(100));
        upd.subscribe(function (layout) {
            console.log(JSON.stringify(layout, undefined, 2));
            lodash_1.each(layout.nodes, function (nodeLayout, id) {
                var node = _this.nodes.get(id);
                node.setLayout(nodeLayout);
            });
            lodash_1.each(layout.edges, function (edgeLayout, id) {
                var edge = _this.edges.get(id);
                edge.setLayout(edgeLayout);
            });
        });
    };
    Scene.computeNodeDimensions = function (inputInfo, outputInfo) {
        return {
            width: Scene.MINIMUM_DIMENSIONS.width,
            height: Scene.MINIMUM_DIMENSIONS.height + Scene.HEIGHT_PER_PROPERTY * Math.max(inputInfo.length, outputInfo.length)
        };
    };
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
        this.nodes.set(node.getIDString(), node);
        var whInfo = { width: Scene.MINIMUM_DIMENSIONS.width, height: Scene.MINIMUM_DIMENSIONS.height };
        this.nodeGraph.setNode(node.getIDString(), whInfo);
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
        this.edges.set(edge.getID(), edge);
        this.nodeGraph.setEdge(from.node.getIDString(), to.node.getIDString(), { id: edge.getID() });
        var fromPropID = edge.getFromIDString();
        var toPropID = edge.getToIDString();
        if (!this.edgeGraph.hasNode(fromPropID)) {
            this.edgeGraph.setNode(fromPropID, { width: 1, height: 1 });
        }
        if (!this.edgeGraph.hasNode(toPropID)) {
            this.edgeGraph.setNode(toPropID, { width: 1, height: 1 });
        }
        this.edgeGraph.setEdge(fromPropID, toPropID, { id: edge.getID() });
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
        this.nodeGraph.removeNode(node.getIDString());
        var nodesValue = this.nodesStream.getValue();
        var index = nodesValue.indexOf(node);
        if (index >= 0) {
            var newNodes = immutability_helper_1["default"](nodesValue, { $splice: [[index, 1]] });
            this.nodesStream.next(newNodes);
        }
    };
    Scene.MINIMUM_DIMENSIONS = { width: 50, height: 50 };
    Scene.HEIGHT_PER_PROPERTY = 40;
    return Scene;
}());
exports.Scene = Scene;
//# sourceMappingURL=Scene.js.map