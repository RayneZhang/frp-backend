"use strict";
exports.__esModule = true;
var Scene_1 = require("./Scene");
exports.Scene = Scene_1.Scene;
var Node_1 = require("./Node");
exports.Node = Node_1.Node;
exports.ObjNode = Node_1.ObjNode;
exports.OpNode = Node_1.OpNode;
var Edge_1 = require("./Edge");
exports.Edge = Edge_1.Edge;
var Scene_2 = require("./Scene");
exports.scene = new Scene_2.Scene();
// const cube = scene.addObj('cube', [{name: 'object', default: 'cube'}, {name: 'position', default: '123'}]);
// const sphere = scene.addObj('sphere', [{name: 'object', default: 'sphere'}, {name: 'position', default: '456'}]);
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
// const translate = scene.addOp('translate');
// scene.addEdge({node: create, prop: 'object'}, {node: translate, prop: 'object'});
// scene.addEdge({node: cube, prop: 'position'}, {node: translate, prop: 'from'});
// scene.addEdge({node: sphere, prop: 'position'}, {node: translate, prop: 'to'});
// translate.pluckInputs().subscribe(function (value) {
//    console.log("translate inputs are", value);
// })
//# sourceMappingURL=index.js.map