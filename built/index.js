"use strict";
exports.__esModule = true;
var WrappedObservable_1 = require("./WrappedObservable");
var WrappedOp_1 = require("./WrappedOp");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
// const a = new WrappedSignal<number>(1);
// const b = new WrappedSignal<number>(2);
// const c = new WrappedSignal<number>(2);
// const add = new WrappedOp<[number, number], [number]>(([x, y]: [number, number]): [number] => {
//     return [x + y];
// }); 
// // const plus = new WrappedOp<[number], number>(([x, y]: [number, number]): number => {
// //     console.log(x);
// //     return x + 1;
// // }); 
// // const inputs = new WrappedObservable<[number]>(from([a]));
// const inps:Observable<[number, number]> = combineLatest<[number, number]>(...[a.getObservable(), b.getObservable()]);
// // inps.subscribe((x) => {
// //     console.log('x is', x);
// // });
// const wrapped = new WrappedObservable<[number, number]>(inps);
// // console.log(wrapped);
// add.setInput(wrapped);
// add.subscribe({
//     next: (v: [number]): void => {
//         console.log(v);
//     }
// })
// const x = add.pipe(map((x)=>x[0]));
// x.subscribe({
//     next: (v: number): void => {
//         console.log("delayed val", v);
//     }
// });
// // plusOne.getOutput().subscribe({
// //     next: (v: number): void => {
// //         console.log(v);
// //     }
// // })
// a.next(20);
// b.next(4)
// a.next(30);
// const inps2:Observable<[number, number]> = combineLatest<[number, number]>(...[a.getObservable(), c.getObservable()]);
// const wrapped2 = new WrappedObservable<[number, number]>(inps2);
// add.setInput(wrapped2);
// c.next(5600)
// console.log(max(add.getObservable()));
var obj = {
    scene: [
        { 'id': 'x', 'type': 'observable', 'op': 'gen', 'parameters': [500] },
        { 'id': 'x3', 'type': 'observable', 'op': 'take', 'parameters': [3], 'pipe': 'x' },
        { 'id': 'y', 'type': 'constant', 'value': 2 },
        { 'id': 'z', 'type': 'op', 'op': '+', 'input': ['x3', 'y'] },
    ]
};
// const ob = new Observable(sub => {
//     let timeout = null;
//     // recursively send a random number to the subscriber
//     // after a random delay
//     (function push() {
//       timeout = setTimeout(
//         () => {
//           sub.next(getRandomNumber());
//           push();
//         },
//         getRandomDelay()
//       );
//     })();
//     // clear any pending timeout on teardown
//     return () => clearTimeout(timeout);
//   });
//   ob.subscribe(console.log);
var ops = {
    '+': function (_a) {
        var x = _a[0], y = _a[1];
        console.log(x, y);
        if (x == null)
            x = 0;
        if (y == null)
            y = 0;
        return [x + y];
    }
};
var observables = {
    'gen': function (delay) {
        return new rxjs_1.Observable(function (sub) {
            var timeout = null;
            // recursively send a random number to the subscriber
            // after a random delay
            (function push() {
                timeout = setTimeout(function () {
                    sub.next(Math.random());
                    push();
                }, delay);
            })();
            // clear any pending timeout on teardown
            return function () { return clearTimeout(timeout); };
        }).pipe(operators_1.startWith(Math.random()));
    },
    'take': function (count) {
        return operators_1.take(count);
    }
};
var objects = {};
var obs = {};
obj.scene.forEach(function (x) {
    var id = x.id, type = x.type;
    if (type === 'constant') {
        var value = x.value;
        objects[id] = new WrappedObservable_1.WrappedObservable(rxjs_1.of(value));
    }
    else if (type === 'op') {
        var op = x.op;
        if (!ops[op]) {
            throw new Error('No op ' + op);
        }
        var wop = new WrappedOp_1.WrappedOp(ops[op]);
        objects[id] = wop;
    }
    else if (type === 'observable') {
        var op = x.op;
        var observable = observables[op].apply(observables, x.parameters);
        obs[id] = observable;
    }
});
obj.scene.forEach(function (x) {
    var id = x.id, type = x.type;
    if (type === 'observable') {
        var op = x.op, pipe = x.pipe;
        if (pipe) {
            console.log(objects[pipe]);
            console.log(obs[id]);
            objects[id] = objects[pipe].pipe(obs[id]);
        }
        else {
            objects[id] = new WrappedObservable_1.WrappedObservable(obs[id]);
        }
    }
});
obj.scene.forEach(function (x) {
    var id = x.id;
    objects[x.id].subscribe({
        next: function (x) {
            console.log(id, 'is now', x);
        }
    });
});
obj.scene.forEach(function (x) {
    if (x.type === 'op') {
        var inps = new WrappedObservable_1.WrappedObservable(rxjs_1.combineLatest.apply(void 0, x.input.map(function (id) { return objects[id].getObservable(); })));
        objects[x.id].setInput(inps);
    }
});
objects['z'].subscribe({
    next: function (v) {
        console.log(v);
    }
});
// console.log(objects);
