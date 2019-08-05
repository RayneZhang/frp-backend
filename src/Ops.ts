import { OpNode,  PROP_DEFAULT_NAME, GenNode } from './Node';
import { Observable, interval } from 'rxjs';
import { take, delay } from 'rxjs/operators';

// unary ops accept *one* arguments
function createUnaryOpNode(name: string, fn: (a: any) => any, arg1Name: string = 'a'): ()=>OpNode {
    return () => new OpNode(name, fn, [{ name: arg1Name }],
                    { name: PROP_DEFAULT_NAME });
}

// binary ops accept *two* arguments
function createBinaryOpNode(name: string, fn: (a: any, b: any) => any, arg1Name: string = 'a', arg2Name: string = 'b'): ()=>OpNode {
    return () => new OpNode(name, fn, [{ name: arg1Name }, { name: arg2Name }],
                    { name: PROP_DEFAULT_NAME });
}

export const ops = {
    '+': () =>  new OpNode('+', (...args: number[]): number => {
                    return args.reduce((pv: number, cv: number) => pv + cv, 0);
                }, [{ name: PROP_DEFAULT_NAME, rest: true }],
                    { name: PROP_DEFAULT_NAME }),
    '-': () =>  createBinaryOpNode('-', (a, b) => a-b),
    '*': () =>  createBinaryOpNode('*', (a, b) => a*b),
    '/': () =>  createBinaryOpNode('/', (a, b) => a/b),
    '%': () =>  createBinaryOpNode('%', (a, b) => a%b),
    'pow': () =>  createBinaryOpNode('pow', (a, b) => Math.pow(a, b), 'num', 'exp'),
    '==': () =>  createBinaryOpNode('==', (a, b) => a==b),
    '>': () =>  createBinaryOpNode('>', (a, b) => a>b),
    '<': () =>  createBinaryOpNode('<', (a, b) => a<b),
    '>=': () =>  createBinaryOpNode('>=', (a, b) => a>=b),
    '<=': () =>  createBinaryOpNode('<=', (a, b) => a<=b),
    'and': () =>  createBinaryOpNode('and', (a, b) => a&&b),
    'or': () =>  createBinaryOpNode('or', (a, b) => a||b),
    'neg': () =>  createUnaryOpNode('neg', (a) => -a),
    'not': () =>  createUnaryOpNode('not', (a) => !a),
    'abs': () =>  createUnaryOpNode('abs', (a) => Math.abs(a)),
    'round': () =>  createUnaryOpNode('round', (a) => Math.round(a)),
    'gen': () => new GenNode(),
    'take': () =>  new OpNode('take', (stream: Observable<any>, count: number): Observable<any> => {
                    return stream.pipe(take(count));
                }, [{ name: 'stream', raw: true }, { name: 'count' }],
                    { name: PROP_DEFAULT_NAME, raw: true }),
    'interval': () =>  new OpNode('interval', (period: number): Observable<any> => {
                    return interval(period);
                }, [{ name: 'period' }],
                    { name: PROP_DEFAULT_NAME, raw: true }),
    'delay': () =>  new OpNode('delay', (stream: Observable<any>, d: number): Observable<any> => {
                    return stream.pipe(delay(d));
                }, [{ name: 'stream', raw: true}, { name: 'delay' }],
                    { name: PROP_DEFAULT_NAME, raw: true }),

}