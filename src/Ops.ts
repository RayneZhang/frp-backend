import { FBOps, FBObservables } from './Scene';
import { ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';

export const ops: FBOps = {
    '+': {
        args: [{name: 'nums', rest: true}],
        output: [{name: 'sum'}],
        fn: (args: number[]): [number] => {
            return [args.reduce((pv: number, cv: number) => pv + cv, 0)];
        }
    }
};

export const observables: FBObservables = {
    'gen': {
        args: [],
        output: [ { name: ''}],
        params: [ { name: 'delay', default: 5 }],
        fn: (delay) => {
            const bs = new ReplaySubject<number>(Math.random());
            const interval = setInterval(() => {
                const val = Math.random();
                // console.log(val);
                bs.next(val);
            }, delay);
            return bs;
        }
    },
    'take': {
        args: [],
        output: [ { name: ''}],
        params: [ { name: 'count' }],
        fn: (count) => {
            return take(count);
        }
    }
};