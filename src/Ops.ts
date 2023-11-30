import { Node, OpNode,  PROP_DEFAULT_NAME, GenNode } from './Node';
import { Observable, interval, BehaviorSubject, of } from 'rxjs';
import { take, delay, mergeMap, map, filter, switchMap } from 'rxjs/operators';
import { scene } from '.';
import { Vector3 } from 'three';

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
    'delay': () =>  new OpNode('delay', (stream: Observable<any>, d: Observable<any>): Observable<any> => {
                    return stream.pipe(
                        switchMap((streamValue) =>
                            d.pipe(
                            // Delay the stream by the value emitted by d
                            delay(streamValue)
                            )
                        ));
                }, [{ name: 'stream', raw: true}, { name: 'delay', raw: true }],
                    { name: PROP_DEFAULT_NAME, raw: true }),
    'snapshot': () =>  new OpNode('snapshot', (signal: Observable<any>, event: Observable<any>): Observable<any> => {
                    return event.pipe(
                        filter((e) => e),
                        mergeMap(() => {
                            return signal.pipe(take(1));
                        })
                    );
                }, [{ name: 'signal', raw: true }, { name: 'event', raw: true }],
                    { name: 'output', raw: true }),
    // 'create': () =>  new OpNode('create', (object: Observable<any>, position: Observable<any>): Observable<any> => {
    //                 return null;
    //             }, [{ name: 'object', raw: true }, { name: 'position', raw: true }],
    //                 { name: 'object', raw: true }),
    'translate': () =>  new OpNode('translate', (object: Observable<any>, from: Observable<any>, to: Observable<any>, speed: Observable<any>): Observable<any> => {
                    return null;
                }, [{ name: 'object', raw: true }, { name : 'from', raw: true }, { name: 'to', raw: true }, { name: 'speed', raw: true, default: of(1)}],
                    { name: 'end', raw: true }),
    'destroy': () =>  new OpNode('destroy', (object: Observable<any>, event: Observable<any>): Observable<any> => {
        return event.pipe(mergeMap((e: any) => {
                return object.pipe(
                    take(1),
                    map((objName) => {
                        const createdNode = scene.getNode(objName);
                        if (!createdNode || !e) return false;
                        else {
                            scene.removeNode(createdNode);
                            return true;
                        }
                    })
                );
            })
        );
    }, [{ name: 'object', raw: true }, { name: 'event', raw: true }],
        { name: 'end', raw: true }),
    'plus': () =>  new OpNode('plus', (...args: Vector3[]): Vector3 => {
        return args.reduce((pv: Vector3, cv: Vector3) => pv.clone().add(cv), new Vector3(0, 0, 0));
    }, [{ name: 'input', rest: true }],
        { name: 'output' }),
    '+ (number)': () =>  new OpNode('+ (number)', (...args: number[]): number => {
        return args.reduce((pv: number, cv: number) => pv+cv, 0);
    }, [{ name: 'input', rest: true }],
        { name: 'output' }),
    '- (number)': () =>  new OpNode('+ (number)', (...args: number[]): number => {
        return args.reduce((pv: number, cv: number) => pv-cv, 0);
    }, [{ name: 'input', rest: true }],
        { name: 'output' }),
    '* (number)': () =>  new OpNode('+ (number)', (...args: number[]): number => {
        return args.reduce((pv: number, cv: number) => pv*cv, 0);
    }, [{ name: 'input', rest: true }],
        { name: 'output' }),
    '/ (number)': () =>  new OpNode('+ (number)', (...args: number[]): number => {
        return args.reduce((pv: number, cv: number) => pv/cv, 0);
    }, [{ name: 'input', rest: true }],
        { name: 'output' }),
    'subtract': () =>  new OpNode('subtract', (vec1: Observable<Vector3>, vec2: Observable<Vector3>): Observable<Vector3> => {
        return null;
    }, [{ name: '+', raw: true }, { name: '-', raw: true }],
        { name: 'output', raw: true }),
}