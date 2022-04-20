export class EventSender<Event = unknown> {
  public constructor(
    destinations: EventDestination<Event>[] = [],
  ) {
    destinations.forEach(d => this.addDestination(d));
  }

  public addDestination(destination: EventDestination<Event>) {
    this.destinations.push(destination);
  }

  public dispatchEvents(events: Event[]) {
    this.destinations.forEach(d => d.sendEvents(events));
  }

  private readonly destinations: EventDestination<Event>[] = []
}

export type EventDestination<Event> = {
  sendEvents(events: ReadonlyArray<Event>): Promise<unknown>
}

export type EventError<T, E = Error> = { error: E, event: T }
