import { Scene } from './Scene';

const scene = new Scene();
const a = scene.addConstant(2000);
// const gen = scene.addOp('gen');
// scene.addEdge(a, {node: gen, prop: 'delay'})
const b = scene.addConstant(10);
const p = scene.addOp('+');
scene.addEdge(b, p);
scene.addEdge(a, p);
p.pluckOutput().subscribe(function (value) {
    console.log("add output is", value);
});

const o = scene.addObj('cube');
o.pluckOutput('color').subscribe(function (value) {
    console.log("obj output is", value);
})