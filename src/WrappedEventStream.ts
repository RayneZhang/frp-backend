import { Observable, Observer, TeardownLogic, Subscription, Subject } from 'rxjs';
import { WrappedObservable } from './WrappedObservable';

export class WrappedEventStreamSource<T> extends WrappedObservable<T> {
    protected observable: Subject<T>;
    public constructor() {
        super(new Subject<T>());
    }

    public error(e: any): void { this.observable.error(e); }
    public complete(): void { this.observable.complete(); }
    public next(e: T): void { this.observable.next(e); }
}