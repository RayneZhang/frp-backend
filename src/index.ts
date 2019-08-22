export { Scene } from './Scene';
export { Node, ObjNode, OpNode } from './Node';
export { Edge } from './Edge';
import { Scene } from './Scene';
export const scene: Scene = new Scene();

// const cube = scene.addObj('cube', [{name: 'color', default: 'red'}, {name: 'position', default: '123'}]);
// const genericBullet = scene.addObj('genericbullet', [{name: 'object', default: 'sphere'}]);
// const e = scene.addObj('e', [{name: 'condition', default: 'false'}]);
// const snapshot = scene.addOp('snapshot');
// const create = scene.addOp('create');

// scene.addEdge({node: cube, prop: 'position'}, {node: snapshot, prop: 'signal'});
// scene.addEdge({node: e, prop: 'condition'}, {node: snapshot, prop: 'event'});

// scene.addEdge({node: genericBullet, prop: 'object'}, {node: create, prop: 'object'});
// scene.addEdge({node: snapshot, prop: 'output'}, {node: create, prop: 'position'});

// create.pluckOutput('object').subscribe(function (value) {
//     console.log("create output is", value);
// })
// cube.update('position', '000');
// e.update('condition', 'true');
// cube.update('position', '111');
// cube.update('position', '222');
// e.update('condition', 'true');

// const createdNode = scene.getNode('node-8');
// createdNode.pluckOutput('position').subscribe(function (value) {
//     console.log("createdNode position is", value);
// })