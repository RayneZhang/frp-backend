"use strict";
exports.__esModule = true;
var Scene_1 = require("./Scene");
var scene = new Scene_1.Scene();
var delay = scene.addConstant(2000);
var gen = scene.addOp('gen');
var three = scene.addConstant(3);
var add = scene.addOp('+');
scene.addEdge(gen, add);
scene.addEdge(three, add);
scene.addEdge(delay, {
    node: gen,
    prop: 'delay'
});
var two = scene.addConstant(2);
scene.addEdge(two, add);
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
add.pluckOutput().subscribe(function (value) {
    console.log("add output is", value);
});
add.getLayoutStream().subscribe(function (layout) {
    console.log("add layout is", layout);
});
//# sourceMappingURL=index.js.map