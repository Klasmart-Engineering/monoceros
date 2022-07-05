import { useReducer, useEffect } from "react";

// D.R.Y.
// Don't Repeat Yourself

/**
 * Wraps a value to make it easier for consumption in react
 * When this value is changed React is notified of the changem allowing components to rerender
 */
 export class ReactiveWrapper<T> {
    public constructor(
        private value: T,
    ) {}

    public set(t: T): void {
        this.value = t;
        this.notifyOfChange();
    }

    public mutate(
        mutator: (t: T) => unknown,
    ): void {
        mutator(this.value);
        this.notifyOfChange();
    }

    private readonly changeListeners = new Set<(t:T) => unknown>();
    
    /* eslint-disable react-hooks/rules-of-hooks */
    public useValue(): T {
        const [,rerender] = useReducer(i=>i+1,0);
        useEffect(() => {
            this.changeListeners.add(rerender)
            return () => { this.changeListeners.delete(rerender); }
        }, [ rerender ])
        return this.value;
    }
    /* eslint-enable react-hooks/rules-of-hooks */

    private notifyOfChange() {
        this.changeListeners.forEach(l => l(this.value))
    }
}