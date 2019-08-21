"use strict";
exports.__esModule = true;
var Scene_1 = require("./Scene");
exports.Scene = Scene_1.Scene;
var Node_1 = require("./Node");
exports.Node = Node_1.Node;
exports.ObjNode = Node_1.ObjNode;
var Edge_1 = require("./Edge");
exports.Edge = Edge_1.Edge;
var Scene_2 = require("./Scene");
var scene = new Scene_2.Scene();
var cube = scene.addObj('cube', [{ name: 'color', "default": 'red' }, { name: 'position', "default": '123' }]);
var sphere = scene.addObj('sphere', [{ name: 'color', "default": 'blue' }, { name: 'position', "default": '456' }]);
var e = scene.addObj('e', [{ name: 'condition', "default": 'false' }]);
var snapshot = scene.addOp('snapshot');
scene.addEdge({ node: cube, prop: 'position' }, { node: sphere, prop: 'position' });
scene.addEdge({ node: sphere, prop: 'position' }, { node: snapshot, prop: 'signal' });
scene.addEdge({ node: e, prop: 'condition' }, { node: snapshot, prop: 'event' });
snapshot.pluckOutput('output').subscribe(function (value) {
    console.log("snapshot output is", value);
});
cube.update('position', '000');
e.update('condition', 'true');
cube.update('position', '111');
cube.update('position', '222');
e.update('condition', 'true');
//# sourceMappingURL=index.js.map