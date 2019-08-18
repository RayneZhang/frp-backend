export { Scene } from './Scene';
export { Node, ObjNode } from './Node';
export { Edge } from './Edge';
// import { Scene } from './Scene';
// import { ObjNode } from './Node';

// const scene = new Scene();

// const cube: ObjNode = scene.addObj('cube', [{name: 'color', default: 'red'}, {name: 'position', default: '123'}]);
// const sphere = scene.addObj('sphere', [{name: 'color', default: 'blue'}, {name: 'position', default: '456'}]);
// sphere.pluckOutput('color').subscribe(function (value) {
//     console.log("sphere output is", value);
// })
// sphere.pluckOutput('position').subscribe(function (value) {
//     console.log("sphere position is", value);
// })
// scene.addEdge({node: cube, prop: 'color'}, {node: sphere, prop: 'color'});
// scene.addEdge({node: cube, prop: 'position'}, {node: sphere, prop: 'position'});
// cube.update('position', '000');
// cube.update('position', '111');