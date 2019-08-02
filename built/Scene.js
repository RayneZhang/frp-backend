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
        this.nodeGraph = new dagre.graphlib.Graph({ multigraph: true, compound: true });
        this.nodesStream = new rxjs_1.BehaviorSubject([]);
        this.edgesStream = new rxjs_1.BehaviorSubject([]);
        this.nodeGraph.setGraph({ rankdir: 'LR' });
        this.nodeGraph.setDefaultEdgeLabel(function () { return ({}); });
        this.establishLayoutStream();
    }
    Scene.prototype.establishLayoutStream = function () {
        var _this = this;
        var upd = this.nodesStream.pipe(operators_1.switchMap(function (nodes) {
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
                var nodeObj = _this.nodeGraph.node(nodeID);
                if (!_this.nodeGraph.hasNode(nodeID)) {
                    _this.nodeGraph.setNode(nodeID, { id: nodeID });
                }
                layout.nodes[nodeID] = { x: -1, y: -1, width: -1, height: -1, inputs: {}, outputs: {} };
                inputInfo.forEach(function (ii) {
                    var name = ii.name;
                    var propID = Edge_1.Edge.getPropIDString(node, name, true);
                    layout.nodes[nodeID].inputs[name] = { name: name, x: -1, y: -1, width: -1, height: -1 };
                    if (!_this.nodeGraph.hasNode(propID)) {
                        _this.nodeGraph.setNode(propID, { id: propID, propName: name, parentID: nodeID, isInput: true });
                        _this.nodeGraph.setParent(propID, nodeID);
                    }
                });
                outputInfo.forEach(function (oi) {
                    var name = oi.name;
                    var propID = Edge_1.Edge.getPropIDString(node, name, false);
                    layout.nodes[nodeID].outputs[name] = { name: oi.name, x: -1, y: -1, width: -1, height: -1 };
                    if (!_this.nodeGraph.hasNode(propID)) {
                        _this.nodeGraph.setNode(propID, { id: propID, propName: name, parentID: nodeID, isInput: false });
                        _this.nodeGraph.setParent(propID, nodeID);
                    }
                });
            });
            nodes.forEach(function (_a) {
                var node = _a[0], inputInfo = _a[1], outputInfo = _a[2], incomingEdges = _a[3], outgoingEdges = _a[4];
                outgoingEdges.forEach(function (edge) {
                    layout.edges[edge.getID()] = [];
                    var v = edge.getFromIDString();
                    var w = edge.getToIDString();
                    if (!_this.nodeGraph.hasEdge({ v: v, w: w })) {
                        _this.nodeGraph.setEdge({ v: v, w: w }, { id: edge.getID() });
                    }
                });
            });
            dagre.layout(_this.nodeGraph);
            _this.nodeGraph.nodes().forEach(function (nodeID) {
                var parent = _this.nodeGraph.parent(nodeID);
                var node = _this.nodeGraph.node(nodeID);
                var id = node.id;
                if (parent === undefined) {
                    layout.nodes[id].x = node.x;
                    layout.nodes[id].y = node.y;
                    layout.nodes[id].width = node.width;
                    layout.nodes[id].height = node.height;
                }
                else {
                    var parentID = node.parentID, isInput = node.isInput, propName = node.propName;
                    var inoutname = isInput ? 'inputs' : 'outputs';
                    layout.nodes[parentID][inoutname][propName].x = node.x;
                    layout.nodes[parentID][inoutname][propName].y = node.y;
                    layout.nodes[parentID][inoutname][propName].width = node.width;
                    layout.nodes[parentID][inoutname][propName].height = node.height;
                }
            });
            _this.nodeGraph.edges().forEach(function (edgeID) {
                var edge = _this.nodeGraph.edge(edgeID);
                layout.edges[edge.id] = edge.points;
            });
            return layout;
        }), operators_1.debounceTime(100));
        upd.subscribe(function (layout) {
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
        var nodeID = node.getIDString();
        // const whInfo = { width: Scene.MINIMUM_DIMENSIONS.width, height: Scene.MINIMUM_DIMENSIONS.height };
        // this.nodeGraph.setNode(nodeID, { id: nodeID });
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