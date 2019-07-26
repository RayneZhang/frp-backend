"use strict";
exports.__esModule = true;
var Scene_1 = require("./Scene");
var scene = new Scene_1.Scene({
    scene: [
    // {'id': 'z2', 'type': 'op', 'op': '+', 'input': ['z.sum', 'x']},
    // {'id': 'z', 'type': 'op', 'op': '+', 'input': ['x', 'y']},
    // {'id': 'x', 'type': 'constant', 'value': 1},
    // {'id': 'y', 'type': 'constant', 'value': 2},
    ]
});
var a = scene.addObservable('gen', [500]);
var b = scene.addObservable('take', [3], a);
var x = scene.addConstant(1);
var y = scene.addConstant(2);
var z = scene.addOp('+', [b, x, y]);
var z2 = scene.addOp('+', [x, z + '.sum']);
//# sourceMappingURL=index.js.map