import { Scene } from './Scene';

const scene = new Scene({
    scene: [
        {'id': 'z2', 'type': 'op', 'op': '+', 'input': ['z.sum', 'x']},
        {'id': 'z', 'type': 'op', 'op': '+', 'input': ['x', 'y']},
        {'id': 'x', 'type': 'constant', 'value': 1},
        {'id': 'y', 'type': 'constant', 'value': 2},
    ]
});