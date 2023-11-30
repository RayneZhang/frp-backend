"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var Node_1 = require("./Node");
var dagre = require("dagre");
var operators_1 = require("rxjs/operators");
var subnodeWidth = 50;
var subnodeHeight = 50;
function getPropID(parentID, childName, io) {
    return parentID + "." + (io === Node_1.IO.Input ? 'in' : 'out') + "." + childName;
}
exports.getPropID = getPropID;
function getLayoutStream(nodesStream, edgesStream) {
    var nodeGraph = new dagre.graphlib.Graph({ multigraph: true, compound: true });
    nodeGraph.setGraph({ rankdir: 'LR' });
    nodeGraph.setDefaultEdgeLabel(function () { return ({}); });
    var nodesAndIOSubnodes = nodesStream.pipe(operators_1.switchMap(function (nodes) {
        return rxjs_1.combineLatest.apply(void 0, nodes.map(function (node) {
            return rxjs_1.combineLatest(rxjs_1.of(node), node.getInputInfoStream(), node.getOutputInfoStream());
        }));
    }));
    nodesAndIOSubnodes.subscribe(function (infos) {
        var desiredNames = [];
        var existingNames = nodeGraph.nodes().map(function (nid) { return nodeGraph.node(nid).id; });
        infos.forEach(function (_a) {
            var node = _a[0], inputs = _a[1], outputs = _a[2];
            var nodeID = node.getID();
            desiredNames.push(nodeID);
            if (!nodeGraph.hasNode(nodeID)) {
                nodeGraph.setNode(nodeID, { id: nodeID });
            }
            var inputs_outputs = inputs.map(function (i) { return ({ io: i, isInput: Node_1.IO.Input }); }).concat(outputs.map(function (o) { return ({ io: o, isInput: Node_1.IO.Output }); }));
            inputs_outputs.forEach(function (_a) {
                var io = _a.io, isInput = _a.isInput;
                var propID = getPropID(nodeID, io.name, isInput);
                desiredNames.push(propID);
                if (!nodeGraph.hasNode(propID)) {
                    nodeGraph.setNode(propID, { id: propID, propName: io.name, parentID: nodeID, isInput: isInput, width: subnodeWidth, height: subnodeHeight });
                    nodeGraph.setParent(propID, nodeID);
                }
            });
        });
        var namesThatShouldntBeThere = difference(existingNames, desiredNames);
        namesThatShouldntBeThere.forEach(function (prop) {
            nodeGraph.removeNode(prop);
        });
    });
    edgesStream.subscribe(function (edges) {
        var graphEdges = nodeGraph.edges();
        var desiredEdgeIDs = [];
        edges.forEach(function (e) {
            var eid = e.getID();
            desiredEdgeIDs.push(eid);
            if (graphEdges.findIndex(function (ge) { return ge.name === eid; }) < 0) {
                var from = e.getFrom();
                var to = e.getTo();
                var v = getPropID(from.node.getID(), from.prop, Node_1.IO.Output);
                var w = getPropID(to.node.getID(), to.prop, Node_1.IO.Input);
                nodeGraph.setEdge({ v: v, w: w, name: eid });
            }
        });
        graphEdges.forEach(function (edge, index) {
            if (desiredEdgeIDs.indexOf(edge.name) < 0) {
                var edge_1 = graphEdges[index];
                nodeGraph.removeEdge(edge_1.v, edge_1.w, edge_1.name);
            }
        });
    });
    var layoutStream = rxjs_1.combineLatest(nodesStream, edgesStream).pipe(operators_1.switchMap(function (_a) {
        var nodes = _a[0];
        return rxjs_1.combineLatest.apply(void 0, nodes.map(function (node) {
            var ioInfoStream = rxjs_1.combineLatest(rxjs_1.of(node), node.getInputInfoStream(), node.getOutputInfoStream());
            return ioInfoStream;
        }));
    }), operators_1.map(function () {
        var layout = {
            nodes: {},
            edges: {}
        };
        dagre.layout(nodeGraph);
        nodeGraph.nodes().forEach(function (nodeID) {
            var parent = nodeGraph.parent(nodeID);
            if (parent === undefined) {
                var node = nodeGraph.node(nodeID);
                var id = node.id;
                layout.nodes[id] = {
                    x: node.x,
                    y: node.y,
                    width: node.width,
                    height: node.height,
                    inputs: {},
                    outputs: {}
                };
            }
        });
        nodeGraph.nodes().forEach(function (nodeID) {
            var parent = nodeGraph.parent(nodeID);
            if (parent !== undefined) {
                var node = nodeGraph.node(nodeID);
                var parentID = node.parentID, isInput = node.isInput, propName = node.propName;
                var inoutname = isInput === Node_1.IO.Input ? 'inputs' : 'outputs';
                layout.nodes[parentID][inoutname][propName] = {
                    x: node.x,
                    y: node.y,
                    width: node.width,
                    height: node.height
                };
            }
        });
        nodeGraph.edges().forEach(function (edgeID) {
            var edge = nodeGraph.edge(edgeID);
            layout.edges[edgeID.name] = { points: edge.points };
        });
        return layout;
    }));
    return layoutStream;
}
exports.getLayoutStream = getLayoutStream;
function difference(arr1, arr2) {
    var diff = new Set(arr1);
    arr2.forEach(function (i) { diff["delete"](i); });
    return Array.from(diff);
}
exports.difference = difference;
//# sourceMappingURL=SceneLayout.js.map