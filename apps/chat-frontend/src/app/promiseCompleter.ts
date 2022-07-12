export class PromiseCompleterMap {
  private pendingPromises = new Map<number, PromiseCompleter>();

  public createPromise<T>(callback?: (id: PromiseId) => unknown) {
    return new Promise<T>((resolve, reject) => {
      const id = this.generateId();
      this.pendingPromises.set(id, { resolve, reject });
      callback?.(id);
    });
  }

  public resolve(id: number, value: unknown) {
    this.consumer(id).resolve(value);
  }

  public reject(id: number, error: unknown) {
    this.consumer(id).reject(error);
  }

  private consumer(id: number) {
    const completer = this.pendingPromises.get(id);
    if (!completer) {
      throw new Error(`Invalid id(${id})`);
    }
    this.pendingPromises.delete(id);
    return completer;
  }

  private nextId = 0;
  private generateId(): PromiseId {
    return this.nextId++;
  }
}

export type PromiseCompleter = {
  resolve: (value: any) => void;
  reject: (error: unknown) => void;
};

export type PromiseId = number;
