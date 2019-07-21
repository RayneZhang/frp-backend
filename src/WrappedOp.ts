import { WrappedObservable } from "./WrappedObservable";
import { WrappedSignal } from "./WrappedSignal";
import { Subscription, OperatorFunction, UnaryFunction, Observable } from "rxjs";
import { map } from 'rxjs/operators';

export class WrappedOp<I, O> {
    private input: WrappedObservable<I>;
    private output: WrappedSignal<O> = new WrappedSignal<O>();
    private subscription: Subscription;
    public constructor(private func: UnaryFunction<I, O>) {
    }
    public setInput(i: WrappedObservable<I>): void {
        this.input = i;
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
        this.subscription = this.input.subscribe({
            next: (e: I): void => {
                this.output.next(this.func(e));
            },
            error: (err: any): void => {
                this.output.error(err);
            }
        })
    }
    public getOutput(): WrappedObservable<O> {
        return this.output;
    }
}