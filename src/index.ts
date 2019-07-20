import { WrappedSignal } from './WrappedSignal';
import { WrappedEventStreamSource } from './WrappedEventStream';
import { WrappedObservable } from './WrappedObservable';
import { WrappedOp } from './WrappedOp';

const a = new WrappedSignal<number>(1);
const b = new WrappedSignal<number>(2);
const plusOne = new WrappedOp<[number, number], number>(([x, y]: [number, number]): number => {
    return x + 1;
}); 

plusOne.setInput([a, b]);
plusOne.getOutput().subscribe({
    next: (v: number): void => {
        console.log(v);
    }
})
a.next(20);
a.next(30);