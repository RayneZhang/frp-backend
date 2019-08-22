export { Scene } from './Scene';
export { Node, ObjNode, OpNode } from './Node';
export { Edge } from './Edge';
import { Scene } from './Scene';
export const scene: Scene = new Scene();

// const cube = scene.addObj('cube', [{name: 'object', default: 'cube'}, {name: 'position', default: '123'}]);
// const sphere = scene.addObj('sphere', [{name: 'object', default: 'sphere'}, {name: 'position', default: '456'}]);
// const genericBullet = scene.addObj('genericbullet', [{name: 'object', default: 'sphere'}]);
// const e = scene.addObj('e', [{name: 'condition', default: 'false'}]);
// const snapshot = scene.addOp('snapshot');
// const create = scene.addOp('create');

// const translate = scene.addOp('translate');
// scene.addEdge({node: cube, prop: 'object'}, {node: translate, prop: 'object'});
// scene.addEdge({node: cube, prop: 'position'}, {node: translate, prop: 'from'});
// scene.addEdge({node: sphere, prop: 'position'}, {node: translate, prop: 'to'});
// translate.pluckOutput('end').subscribe(function (value) {
//    console.log("translate output is", value);
// })

// translate.update('end', true);

// translate.pluckOutput('end').subscribe(function (value) {
//     console.log("translate output is", value);
// })

// scene.addEdge({node: cube, prop: 'position'}, {node: snapshot, prop: 'signal'});
// scene.addEdge({node: e, prop: 'condition'}, {node: snapshot, prop: 'event'});

// scene.addEdge({node: genericBullet, prop: 'object'}, {node: create, prop: 'object'});
// scene.addEdge({node: snapshot, prop: 'output'}, {node: create, prop: 'position'});

// create.pluckOutput('object').subscribe(function (value) {
//     console.log("create output is", value);
// })
// create.pluckInputs().subscribe((x) => {
//     console.log(x);
// });
// cube.update('position', '000');
// e.update('condition', 'true');
// cube.update('position', '111');
// cube.update('position', '222');
// e.update('condition', 'true');

// const createdNode = scene.getNode('node-8');
// createdNode.pluckOutput('position').subscribe(function (value) {
//     console.log("createdNode position is", value);
// })