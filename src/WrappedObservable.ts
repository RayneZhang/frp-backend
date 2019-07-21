import { Observable, Observer, Subscription, OperatorFunction } from "rxjs";

export class WrappedObservable<T> {
    public constructor(protected observable: Observable<T>) {
        
    }

    public subscribe({ next, error, complete }: { next: (e: T) => void; error?: (err: any) => void; complete?: () => void; }): Subscription {
        const observer: Observer<T> = { next, error, complete };
        return this.observable.subscribe(observer);
    }

    public pipe<O> (func: OperatorFunction<T, O>): WrappedObservable<O> {
        return new WrappedObservable<O>(this.observable.pipe(func));
    }
}