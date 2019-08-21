export { Scene } from './Scene';
export { Node, ObjNode } from './Node';
export { Edge } from './Edge';
// import { Scene } from './Scene';

// const scene = new Scene();

// const cube = scene.addObj('cube', [{name: 'color', default: 'red'}, {name: 'position', default: '123'}]);
// const sphere = scene.addObj('sphere', [{name: 'color', default: 'blue'}, {name: 'position', default: '456'}]);
// const e = scene.addObj('e', [{name: 'condition', default: 'false'}]);
// const snapshot = scene.addOp('snapshot');

// scene.addEdge({node: cube, prop: 'position'}, {node: sphere, prop: 'position'});

// scene.addEdge({node: sphere, prop: 'position'}, {node: snapshot, prop: 'signal'});
// scene.addEdge({node: e, prop: 'condition'}, {node: snapshot, prop: 'event'});

// snapshot.pluckOutput('output').subscribe(function (value) {
//     console.log("snapshot output is", value);
// })
// cube.update('position', '000');
// e.update('condition', 'true');
// cube.update('position', '111');
// cube.update('position', '222');
// e.update('condition', 'true');