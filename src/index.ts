export type Reducer<
  State,
  Requests,
  Action extends keyof Requests = keyof Requests,
  Payload extends Requests[Action] = Requests[Action]
> = (
  state: State,
  action: Action,
  payload: Payload,
  dispatch: <Action extends keyof Requests>(
    action: Action,
    payload: Requests[Action]
  ) => void
) => State;

export type ReducerMap<State, Requests> = {
  [Action in keyof Requests]: Reducer<
    State,
    Requests,
    Action,
    Requests[Action]
  >;
};

export type Observer<State> = (state: State) => void;
export type Selector<State> = (state: State) => any;

export class Observable<State> {
  public observers: { [key: string]: Observer<State> } = {};
  public nextObserverId: number = 1;

  constructor(protected state: State, protected closeCallback?: () => void) {}

  getState() {
    return this.state;
  }

  setState(state: State) {
    if (this.state !== state) {
      this.state = state;
      for (let id in this.observers) {
        this.observers[id](state);
      }
    }
  }

  subscribe(observer: Observer<State>) {
    this.observers[this.nextObserverId] = observer;
    return this.nextObserverId++;
  }

  unsubscribe(id: number) {
    delete this.observers[id];
  }

  select(selector: Selector<State>) {
    let id: number;

    const observable = new Observable<State>(selector(this.state), () =>
      this.unsubscribe(id)
    );

    id = this.subscribe(newState => {
      observable.setState(selector(newState));
    });

    return observable;
  }

  close() {
    this.closeCallback?.();
    this.observers = {};
    this.nextObserverId = 1;
  }
}

export type Logger<State, Requests> = (state: State, action: keyof Requests, payload: Requests[keyof Requests]) => void;

export class Store<
  State,
  Requests extends Record<number | string, any>
> extends Observable<State> {
  constructor(
    protected state: State,
    public reducers: ReducerMap<State, Requests>,
    public logger?: Logger<State, Requests>
  ) {
    super(state);
  }

  dispatch<Action extends keyof Requests>(
    action: Action,
    payload: Requests[Action]
  ) {
    let state = this.state;
    const actions: [action: keyof Requests, payload: Requests[keyof Requests]][] = [[action, payload]];
    let synchrounous = true;
    const smartDispatch = (action: keyof Requests, payload: Requests[keyof Requests]) => synchrounous ? actions.push([action, payload]) : this.dispatch(action, payload);
    let i = 0;

    while (i < actions.length) {
      const [action, payload] = actions[i];
      state = this.reducers[action](state, action, payload, smartDispatch);
      this.logger?.(state, action, payload);
      i++;
    }

    synchrounous = false;

    this.setState(state);
  }
}
