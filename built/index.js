"use strict";
exports.__esModule = true;
var Scene_1 = require("./Scene");
exports.Scene = Scene_1.Scene;
var Node_1 = require("./Node");
exports.Node = Node_1.Node;
var Edge_1 = require("./Edge");
exports.Edge = Edge_1.Edge;
var Scene_2 = require("./Scene");
var scene = new Scene_2.Scene();
var cube = scene.addObj('cube', [{ name: 'color', "default": 'red' }, { name: 'position', "default": '123' }]);
var sphere = scene.addObj('sphere', [{ name: 'color', "default": 'blue' }, { name: 'position', "default": '456' }]);
sphere.pluckOutput('color').subscribe(function (value) {
    console.log("sphere output is", value);
});
sphere.pluckOutput('position').subscribe(function (value) {
    console.log("sphere position is", value);
});
scene.addEdge({ node: cube, prop: 'color' }, { node: sphere, prop: 'color' });
scene.addEdge({ node: cube, prop: 'position' }, { node: sphere, prop: 'position' });
cube.update('position', '000');
//# sourceMappingURL=index.js.map