"use strict";
exports.__esModule = true;
var Scene_1 = require("./Scene");
var scene = new Scene_1.Scene();
var one = scene.addConstant(1);
var two = scene.addConstant(2);
var three = scene.addConstant(3);
var add = scene.addOp('+');
scene.addEdge(one, add);
// const five = scene.addConstant(5);
// const one = scene.addConstant(1);
// const add = scene.addOp('+');
// const delay = scene.addConstant(2000);
// const gen = scene.addOp('interval');
// const three = scene.addConstant(3);
// const take = scene.addOp('take');
// scene.addEdge(three, {
//     node: take,
//     prop: 'count'
// });
// scene.addEdge(gen, {
//     node: take,
//     prop: 'stream'
// });
// scene.addEdge(delay, {
//     node: gen,
//     prop: 'period'
// });
// take.pluckOutput().subscribe((value) => {
//     console.log("take output is", value);
// });
// scene.addEdge(five, add);
// scene.addEdge(gen, add);
// scene.addEdge(one, add);
// add.pluckOutput().subscribe((value) => {
//     console.log("add output is", value);
// });
//# sourceMappingURL=index.js.map