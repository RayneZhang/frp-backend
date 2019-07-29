import { OpNode,  PROP_DEFAULT_NAME, GenNode } from './Node';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

export const ops = {
    '+': () =>  new OpNode((...args: number[]): number => {
                    return args.reduce((pv: number, cv: number) => pv + cv, 0);
                }, [{ name: PROP_DEFAULT_NAME, rest: true }],
                    { name: PROP_DEFAULT_NAME }),
    '-': () =>  new OpNode((a: number, b: number): number => {
                    return a-b;
                }, [{ name: 'a' }, { name: 'b' }],
                    { name: PROP_DEFAULT_NAME }),
    '*': () =>  new OpNode((a: number, b: number): number => {
                    return a*b;
                }, [{ name: 'a' }, { name: 'b' }],
                    { name: PROP_DEFAULT_NAME }),
    '/': () =>  new OpNode((a: number, b: number): number => {
                    return a/b;
                }, [{ name: 'a' }, { name: 'b' }],
                    { name: PROP_DEFAULT_NAME }),
    'gen': () => new GenNode(),
    'take': () =>  new OpNode((stream: Observable<any>, count: number): Observable<any> => {
                    return stream.pipe(take(count));
                }, [{ name: 'stream', raw: true }, { name: 'count' }],
                    { name: PROP_DEFAULT_NAME }),

}