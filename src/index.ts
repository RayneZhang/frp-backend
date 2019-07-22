import { WrappedSignal } from './WrappedSignal';
import { WrappedEventStreamSource } from './WrappedEventStream';
import { WrappedObservable } from './WrappedObservable';
import { WrappedOp } from './WrappedOp';
import { combineLatest, from, merge, Observable, of } from "rxjs";
import { delay, map, startWith, take } from "rxjs/operators";

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
const obj = {
    scene: [
        {'id': 'x', 'type': 'observable', 'op': 'gen', 'parameters': [500]},
        {'id': 'x3', 'type': 'observable', 'op': 'take', 'parameters': [3], 'pipe': 'x'},
        {'id': 'y', 'type': 'constant', 'value': 2},
        {'id': 'z', 'type': 'op', 'op': '+', 'input': ['x3', 'y']},
    ] 
}


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
const ops = {
    '+': ([x, y]: [number, number]): [number] => {
        console.log(x, y);
        if ( x == null) x = 0
        if ( y == null) y = 0
        return [x + y];
    }
};

const observables = {
    'gen': (delay) => {
        return new Observable(sub => {
            let timeout = null;
        
            // recursively send a random number to the subscriber
            // after a random delay
            (function push() {
                timeout = setTimeout(
                    () => {
                        sub.next(Math.random());
                        push();
                    },
                    delay
                );
            })();
        
            // clear any pending timeout on teardown
            return () => clearTimeout(timeout);
        }).pipe(startWith(Math.random()));
    },
    'take': (count) => {
        return take(count);
    }
};

const objects = {};
const obs = {};
obj.scene.forEach((x) => {
    const { id, type } = x;
    if(type === 'constant') {
        const { value } = x;
        objects[id] = new WrappedObservable<any>(of(value));
    } else if(type === 'op') {
        const { op } = x;
        if(!ops[op]) {
            throw new Error('No op ' + op);
        }
        const wop = new WrappedOp(ops[op]);
        objects[id] = wop;
    } else if(type === 'observable') {
        const { op } = x;
        const observable = observables[op](...x.parameters);
        obs[id] = observable;
    }
});

obj.scene.forEach((x) => {
    const { id, type } = x;
    if(type === 'observable') {
        const { op, pipe } = x;
        if(pipe) {
            objects[id] = objects[pipe].pipe(obs[id]);
        } else {
            objects[id] = new WrappedObservable<any>(obs[id]);
        }
    }
});

obj.scene.forEach((x) => {
    const { id } = x;
    objects[x.id].subscribe({
        next: (x) => {
            console.log(id, 'is now', x);
        }
    });
});

obj.scene.forEach((x) => {
    if(x.type === 'op') {
        const inps = new WrappedObservable(combineLatest<any>(...x.input.map((id) => objects[id].getObservable())));
        objects[x.id].setInput(inps);
    }
});
objects['z'].subscribe({
    next: (v: any): void => {
        console.log(v);
    }
})
// console.log(objects);