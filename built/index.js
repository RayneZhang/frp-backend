"use strict";
exports.__esModule = true;
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
var o = scene.addObj('cube');
o.pluckOutput('color').subscribe(function (value) {
    console.log("obj output is", value);
});
//# sourceMappingURL=index.js.map