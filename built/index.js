"use strict";
exports.__esModule = true;
//export { Scene } from './Scene';
var Scene_1 = require("./Scene");
var scene = new Scene_1.Scene();
var a = scene.addConstant(2000);
// const gen = scene.addOp('gen');
// scene.addEdge(a, {node: gen, prop: 'delay'})
var b = scene.addConstant(10);
var p = scene.addOp('+');
scene.addEdge(b, p);
scene.addEdge(a, p);
p.pluckOutput().subscribe(function (value) {
    console.log("add output is", value);
});
var cube = scene.addObj('cube', [{ name: 'color', "default": 'red' }]);
var sphere = scene.addObj('sphere', [{ name: 'color', "default": 'blue' }]);
sphere.pluckOutput('color').subscribe(function (value) {
    console.log("sphere output is", value);
});
scene.addEdge({ node: cube, prop: 'color' }, { node: sphere, prop: 'color' });
//# sourceMappingURL=index.js.map