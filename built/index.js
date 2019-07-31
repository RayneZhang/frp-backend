"use strict";
exports.__esModule = true;
var Scene_1 = require("./Scene");
var scene = new Scene_1.Scene();
var five = scene.addConstant(5);
var one = scene.addConstant(1);
var add = scene.addOp('+');
var delay = scene.addConstant(2000);
var gen = scene.addOp('interval');
var three = scene.addConstant(3);
var take = scene.addOp('take');
scene.addEdge(three, {
    node: take,
    prop: 'count'
});
scene.addEdge(gen, {
    node: take,
    prop: 'stream'
});
scene.addEdge(delay, {
    node: gen,
    prop: 'period'
});
take.pluckOutput().subscribe(function (value) {
    console.log("take output is", value);
});
scene.addEdge(five, add);
scene.addEdge(gen, add);
scene.addEdge(one, add);
add.pluckOutput().subscribe(function (value) {
    console.log("add output is", value);
});
//# sourceMappingURL=index.js.map