"use strict";
exports.__esModule = true;
var Edge_1 = require("./Edge");
var Node_1 = require("./Node");
var Ops_1 = require("./Ops");
var rxjs_1 = require("rxjs");
var immutability_helper_1 = require("immutability-helper");
var SceneLayout_1 = require("./SceneLayout");
/**
 * A scene represents a complete program
 */
var Scene = /** @class */ (function () {
    function Scene() {
        this.nodesStream = new rxjs_1.BehaviorSubject([]); // A stream of lists of nodes
        this.edgesStream = new rxjs_1.BehaviorSubject([]); // A stream of lists of edges
        this.layoutStream = SceneLayout_1.getLayoutStream(this.getNodesStream(), this.getEdgesStream()); // A stream with the layout (where to position objects)
        // A subscription to update individual nodes/edges' layouts from a single layout object
        rxjs_1.combineLatest(this.layoutStream, this.getNodesStream(), this.getEdgesStream()).subscribe(function (_a) {
            var layout = _a[0], nodes = _a[1], edges = _a[2];
            // Go through all of the nodes and update their layouts
            nodes.forEach(function (node) {
                var id = node.getID();
                if (layout.nodes[id]) {
                    node._setLayout(layout.nodes[id]);
                }
            });
            // Go through all the edges and update their layouts
            edges.forEach(function (edge) {
                var id = edge.getID();
                if (layout.edges[id]) {
                    edge.setLayout(layout.edges[id]);
                }
            });
        });
    }
    /**
     * Add a constant value to the scene
     * @param value The constant value to add
     */
    Scene.prototype.addConstant = function (value) {
        var node = new Node_1.ConstantNode(value);
        return this.addNode(node);
    };
    /**
     * Add an operation to the scene
     * @param name The name of the op (a key in Op.ts)
     */
    Scene.prototype.addOp = function (name) {
        var opFn = Ops_1.ops[name];
        var op = opFn();
        this.addNode(op);
        return op;
    };
    /**
     * Add an object to the scene
     * @param name The human-readable label of the object
     * @param inputs The input infos with default values
     */
    Scene.prototype.addObj = function (name, inputs) {
        var obj = new Node_1.ObjNode(name, inputs);
        this.addNode(obj);
        return obj;
    };
    /**
     * Add a static Operator in the scene, which menas that the inputs and outputs are updated from front-end.
     * @param name The human-readable label of the object
     * @param inputs The input infos with default values
     * @param outpus The ouput infos with default values
     */
    Scene.prototype.addPuppet = function (name, inputs, outputs) {
        var pup = new Node_1.PupNode(name, inputs, outputs);
        this.addNode(pup);
        return pup;
    };
    // Add any node to the scene
    Scene.prototype.addNode = function (node) {
        var nodesValue = this.nodesStream.getValue();
        var newNodes = immutability_helper_1["default"](nodesValue, { $push: [node] }); // Add the node to the list of nodes (without mutating)
        this.nodesStream.next(newNodes); // Update my list of ndoes
        return node;
    };
    /**
     * Add a new edge between node properties
     *
     * @param from {node: Node, prop: string}: Where this edge leaves from
     * @param to {node: Node, prop: string}: Where this edge goes to
     */
    Scene.prototype.addEdge = function (from, to) {
        // If only the Node is supplied, we use the default prop name
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
        var newEdges = immutability_helper_1["default"](edgesValue, { $push: [edge] }); // Add the edge to the list (with no mutations)
        this.edgesStream.next(newEdges);
        return edge;
    };
    /**
     *  Remove an edge from the scene
     * @param edge The edge to remove
     */
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
            edge.remove();
        }
    };
    /**
     * Remove a node from the scene
     * @param node The Node to remove
     */
    Scene.prototype.removeNode = function (node) {
        var nodesValue = this.nodesStream.getValue();
        var index = nodesValue.indexOf(node);
        if (index >= 0) {
            //We need to remove any edges that involve this node, so we'll see which ones we need to remove...
            var edgesValue = this.edgesStream.getValue();
            var toRemoveEdges_1 = edgesValue.filter(function (e) { return ((e.getFrom().node === node) || (e.getTo().node === node)); });
            if (toRemoveEdges_1.length > 0) { // if we have any edges to remove...
                toRemoveEdges_1.forEach(function (edge) {
                    var from = edge.getFrom();
                    var to = edge.getTo();
                    from.node.removeOutgoingEdge(edge);
                    to.node.removeIncomingEdge(edge);
                    edge.remove();
                });
                this.edgesStream.next(edgesValue.filter(function (e) { return toRemoveEdges_1.indexOf(e) < 0; }));
            }
            // Finally, remove the node
            var newNodes = immutability_helper_1["default"](nodesValue, { $splice: [[index, 1]] });
            this.nodesStream.next(newNodes);
            node.remove();
        }
    };
    /**
     * Get a stream whose values are the current nodes in the scene
     */
    Scene.prototype.getNodesStream = function () { return this.nodesStream; };
    /**
     * Get a stream whose values are the current edges in the scene
     */
    Scene.prototype.getEdgesStream = function () { return this.edgesStream; };
    /**
     * Returns a node based on the given node id
     * @param nodeID The node's unique ID
     */
    Scene.prototype.getNode = function (nodeID) {
        var nodesValue = this.nodesStream.getValue();
        // Go through all of the nodes and compare their IDs
        for (var i = 0; i < nodesValue.length; i++) {
            if (nodeID === nodesValue[i].getID())
                return nodesValue[i];
        }
        // Return null if there is no node ID match
        return null;
    };
    /**
    * Returns an edge based on the given edge id
    * @param edgeID The edge's unique ID
    */
    Scene.prototype.getEdge = function (edgeID) {
        var edgesValue = this.edgesStream.getValue();
        // Go through all of the nodes and compare their IDs
        for (var i = 0; i < edgesValue.length; i++) {
            if (edgeID === edgesValue[i].getID())
                return edgesValue[i];
        }
        // Return null if there is no edge ID match
        return null;
    };
    return Scene;
}());
exports.Scene = Scene;
//# sourceMappingURL=Scene.js.map