import { BehaviorSubject } from 'rxjs';
import { WrappedObservable } from './WrappedObservable';

export class WrappedSignal<T> extends WrappedObservable<T> {
    protected observable: BehaviorSubject<T>;

    public constructor(value?: T) {
        super(new BehaviorSubject<T>(value));
    }

    public next(value: T): void { this.observable.next(value); }
    public error(err: any): void { this.observable.error(err); }
    public complete(): void { this.observable.complete(); }

    public getValue(): T {
        return this.observable.getValue();
    }
}