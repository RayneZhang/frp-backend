import { WrappedObservable } from "./WrappedObservable";
import { WrappedSignal } from "./WrappedSignal";
import { Subscription, OperatorFunction, UnaryFunction, Observable, BehaviorSubject, ReplaySubject } from "rxjs";
import { map } from 'rxjs/operators';

export class WrappedOp<I extends Array<any>, O> extends WrappedObservable<O> {
    public static NO_OUT = null;

    protected observable: ReplaySubject<O>;

    private subscription: Subscription;
    public constructor(private func: (inp: I) => O, initialValue=WrappedOp.NO_OUT) {
        super(new ReplaySubject<O>(initialValue));
    }
    public setInput(inputs: WrappedObservable<I>): void {
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
        this.subscription = inputs.subscribe({
            next: (e: I): void => {
                this.observable.next(this.func(e));
            },
            error: (err: any): void => {
                this.observable.error(err);
            }
        });
    }
    public complete(): void {
        this.observable.complete();
    }
}