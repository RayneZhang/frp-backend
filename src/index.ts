// import { Scene } from './Scene';

// const scene = new Scene({
//     scene: [
//         // {'id': 'z2', 'type': 'op', 'op': '+', 'input': ['z.sum', 'x']},
//         // {'id': 'z', 'type': 'op', 'op': '+', 'input': ['x', 'y']},
//         // {'id': 'x', 'type': 'constant', 'value': 1},
//         // {'id': 'y', 'type': 'constant', 'value': 2},
//     ]
// });

// const t = scene.addConstant(2);
// const f = scene.addConstant(500);
// const a = scene.addObservable('gen', [f]);
// const b = scene.addObservable('take', [a, t]);
// const x = scene.addConstant(1);
// const y = scene.addConstant(2);
// const z = scene.addOp('+', [b, x, y]);
// const z2 = scene.addOp('+', [x, `${z}.sum`]);

import { Node, OpNode } from './Node';
import { from, BehaviorSubject } from 'rxjs';
import { Scene } from './Scene';

// Create a new scene...
const scene = new Scene();

const five = scene.addConstant(5);
const one = scene.addConstant(1);
const add = scene.addOp('+');
const delay = scene.addConstant(2000);
const gen = scene.addOp('gen');

scene.addEdge(delay, {
    node: gen,
    prop: 'delay'
});

gen.pluckOutput().subscribe((value) => {
    console.log("gen output is", value);
});
scene.addEdge(five, add);
scene.addEdge(one, add);
scene.addEdge(one, add);

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