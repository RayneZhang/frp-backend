import { WrappedObservable } from "./WrappedObservable";
import { WrappedSignal } from "./WrappedSignal";
import { Subscription, OperatorFunction, UnaryFunction, Observable } from "rxjs";
import { map } from 'rxjs/operators';

export class WrappedOp<I, O> {
    private input: WrappedObservable<I>;
    private output: WrappedObservable<O> = new WrappedSignal<O>();
    private subscription: Subscription;
    public constructor(private func: UnaryFunction<I, O>) {
    }
    public setInput(i: WrappedObservable<I>): void {
        this.input = i;
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
        this.output = this.input.pipe<O>(map(this.func));
        // (i: Observable<I>): Observable<O> => {
        //     return map
        //     console.log(i);
        //     const subscription = i.subscribe({
        //         next: (inp: I): O => {
        //             return this.func(inp);
        //         }
        //     });
        //     return null;
        // });
    }
    public getOutput(): WrappedObservable<O> {
        return this.output;
    }
}