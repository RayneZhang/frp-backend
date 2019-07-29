"use strict";
// import { Scene } from './Scene';
exports.__esModule = true;
var Scene_1 = require("./Scene");
// Create a new scene...
var scene = new Scene_1.Scene();
var five = scene.addConstant(5);
var one = scene.addConstant(1);
var add = scene.addOp('+');
var delay = scene.addConstant(2000);
var gen = scene.addOp('gen');
scene.addEdge(delay, {
    node: gen,
    prop: 'delay'
});
gen.pluckOutput().subscribe(function (value) {
    console.log("gen output is", value);
});
scene.addEdge(five, add);
scene.addEdge(one, add);
scene.addEdge(gen, add);
add.pluckOutput().subscribe(function (value) {
    console.log("+ output is", value);
});
add.getInputInfoStream().forEach(function (ii) {
    console.log(ii);
});
add.getOutputInfoStream().forEach(function (ii) {
    console.log(ii);
});
// const delay  = scene.addConstant(500);
// const randNum = scene.addOp('gen');
// scene.addEdge(delay, {
//     node: randNum,
//     prop: 'delay'
// })
// const a = scene.addConstant(1);
// const b = scene.addConstant(2);
// const c = scene.addOp('+');
// const three = scene.addConstant(3);
// const take = scene.addOp('take');
// scene.addEdge(three, {
//     node: take,
//     prop: 'count'
// });
// scene.addEdge(randNum, {
//     node: take,
//     prop: 'stream'
// });
// const d = scene.addOp('+');
// scene.addEdge(a, c);
// scene.addEdge(take, c);
// scene.addEdge(a, d);
// randNum.pluckOutput().subscribe({
//     next: (v) => {
//         console.log('randNum is ' + v);
//     }
// })
// c.pluckOutput().subscribe({
//     next: (v) => {
//         console.log('c is ' + v);
//     }
// })
// scene.addEdge(b, c);
// scene.addEdge({
//     node: b,
//     prop: ''
// }, {
//     node: c,
//     prop: ''
// });
// const plusOne = new OpNode<number, number>((x) => x+1);
// const out = plusOne.getOutputStream();
// out.subscribe({
//     next: (v) => {
//         console.log(v);
//     }
// })
// plusOne.setInputStream(a);
// a.next(5);
// const b = new BehaviorSubject(20);
// a.next(6);
// plusOne.setInputStream(b);
// b.next(30);
// a.next(7);
// b.next(40);
//# sourceMappingURL=index.js.map