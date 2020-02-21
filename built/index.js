"use strict";
exports.__esModule = true;
var Scene_1 = require("./Scene");
exports.Scene = Scene_1.Scene;
var Node_1 = require("./Node");
exports.Node = Node_1.Node;
exports.ObjNode = Node_1.ObjNode;
exports.OpNode = Node_1.OpNode;
exports.PupNode = Node_1.PupNode;
var Edge_1 = require("./Edge");
exports.Edge = Edge_1.Edge;
var Scene_2 = require("./Scene");
var Display_1 = require("./Display");
exports.scene = new Scene_2.Scene();
var drawing = new Display_1.SceneDisplay('drawing', exports.scene); // Create a drawing output (looks for a <div> with id='drawing')
var ten = exports.scene.addConstant(10);
var twenty = exports.scene.addConstant(20);
var thirty = exports.scene.addConstant(30);
var plus = exports.scene.addOp('+');
exports.scene.addEdge(ten, plus);
exports.scene.addEdge(twenty, plus); // Assumes default property ('')
exports.scene.addEdge({
    node: thirty,
    prop: ''
}, {
    node: plus,
    prop: ''
});
exports.scene.removeNode(thirty);
// const cube = scene.addObj('cube', [{name: 'object', default: 'cube'}, {name: 'triggerdown', default: false}]);
// const sphere = scene.addObj('sphere', [{name: 'object', default: 'sphere'}, {name: 'light_off', default: ''}]);
// const collidePup = scene.addPuppet('collision', [{name: 'obj1'}, {name: 'obj2'}], [{name: 'start'}, {name: 'end'}]);
// const genericBullet = scene.addObj('genericbullet', [{name: 'object', default: 'sphere'}]);
// const e = scene.addObj('e', [{name: 'condition', default: false}]);
// const snapshot = scene.addOp('snapshot');
// const create = scene.addOp('create');
// const destroy = scene.addOp('destroy');
// const sub = scene.addOp('subtract');
// collidePup.pluckInputs().subscribe((value) => {
//     console.log('inputs: ' + value);
// });
// scene.addEdge({node: cube, prop: 'object'}, {node: collidePup, prop: 'obj1'});
// scene.addEdge({node: sphere, prop: 'object'}, {node: collidePup, prop: 'obj2'});
// collidePup.pluckOutput('start').subscribe((value) => {
//     console.log(value);
// });
// collidePup.updateOutput('start', true);
// scene.addEdge({node: sphere, prop: 'position'}, {node: sub, prop: '-'});
// scene.addEdge({node: sub, prop: 'output'}, {node: cube, prop: 'direction'});
// sub.pluckOutput('output').subscribe(function (value) {
//     console.log("cube_direction output is", value);
// })
// cube.update('cube_direction', '');
// cube.update('cube_direction', '');
// cube.update('cube_direction', '');
// scene.addEdge({node: cube, prop: 'object'}, {node: destroy, prop: 'object'});
// scene.addEdge({node: e, prop: 'condition'}, {node: destroy, prop: 'event'});
// scene.addEdge({node: sphere, prop: 'position'}, {node: snapshot, prop: 'signal'});
// scene.addEdge({node: e, prop: 'condition'}, {node: snapshot, prop: 'event'});
// snapshot.pluckOutput('output').subscribe(function (value) {
//     console.log("snapshot output is", value);
// })
// e.update('condition', true);
// e.update('condition', false);
// e.update('condition', true);
// scene.addEdge({node: genericBullet, prop: 'object'}, {node: create, prop: 'object'});
// scene.addEdge({node: cube, prop: 'position'}, {node: create, prop: 'position'});
// create.pluckOutput('object').subscribe(function (value) {
//     console.log("create object is", value);
// })
// cube.update('position', '000');
// cube.update('position', '111');
// cube.update('position', '222');
// create.updateOutput('object', 'node-3');
// create.updateOutput('object', 'node-4');
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
//# sourceMappingURL=index.js.map