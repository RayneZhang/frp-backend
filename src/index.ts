import { Scene } from './Scene';

const scene = new Scene({
    scene: [
        // {'id': 'z2', 'type': 'op', 'op': '+', 'input': ['z.sum', 'x']},
        // {'id': 'z', 'type': 'op', 'op': '+', 'input': ['x', 'y']},
        // {'id': 'x', 'type': 'constant', 'value': 1},
        // {'id': 'y', 'type': 'constant', 'value': 2},
    ]
});

const a = scene.addObservable('gen', [500]);
const b = scene.addObservable('take', [3], a);
const x = scene.addConstant(1);
const y = scene.addConstant(2);
const z = scene.addOp('+', [b, x, y]);
const z2 = scene.addOp('+', [x, z+'.sum']);