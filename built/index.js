"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Scene_1 = require("./Scene");
var scene = new Scene_1.Scene({
    scene: [
        { 'id': 'z2', 'type': 'op', 'op': '+', 'input': ['z.sum', 'x'] },
        { 'id': 'z', 'type': 'op', 'op': '+', 'input': ['x', 'y'] },
        { 'id': 'x', 'type': 'constant', 'value': 1 },
        { 'id': 'y', 'type': 'constant', 'value': 2 },
    ]
});
//# sourceMappingURL=index.js.map