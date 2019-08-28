export { Scene } from './Scene';
export { Node, ObjNode, OpNode } from './Node';
export { Edge } from './Edge';
import { Scene } from './Scene';
export const scene: Scene = new Scene();

// const cube = scene.addObj('cube', [{name: 'object', default: 'cube'}, {name: 'position', default: '123'}]);
// const sphere = scene.addObj('sphere', [{name: 'object', default: 'sphere'}, {name: 'position', default: '456'}]);
// const genericBullet = scene.addObj('genericbullet', [{name: 'object', default: 'sphere'}]);
// const e = scene.addObj('e', [{name: 'condition', default: false}]);
// const snapshot = scene.addOp('snapshot');
// const create = scene.addOp('create');
// const destroy = scene.addOp('destroy');

// scene.addEdge({node: cube, prop: 'position'}, {node: sphere, prop: 'position'});

// scene.addEdge({node: cube, prop: 'object'}, {node: destroy, prop: 'object'});
// scene.addEdge({node: e, prop: 'condition'}, {node: destroy, prop: 'event'});

// // scene.addEdge({node: genericBullet, prop: 'object'}, {node: create, prop: 'object'});
// // scene.addEdge({node: snapshot, prop: 'output'}, {node: create, prop: 'position'});
// // cube.update('object', 'node-1');

// sphere.pluckOutput('position').subscribe(function (value) {
//     console.log("sphere position is", value);
// })
// destroy.pluckOutput('end').subscribe(function (value) {
//     console.log("destroy output is", value);
// })

// cube.update('position', '000');
// e.update('condition', true);
// cube.update('position', '111');
// cube.update('position', '222');
// e.update('condition', 'true');

// const translate = scene.addOp('translate');
// scene.addEdge({node: genericBullet, prop: 'object'}, {node: translate, prop: 'object'});
// scene.addEdge({node: cube, prop: 'position'}, {node: translate, prop: 'from'});
// scene.addEdge({node: sphere, prop: 'position'}, {node: translate, prop: 'to'});
// translate.pluckInputs().subscribe(function (value) {
//    console.log("translate inputs are", value);
// })
// translate.pluckOutput('end').subscribe((x) => {
//     console.log(x);
// });
// translate.updateOutput('end', true);