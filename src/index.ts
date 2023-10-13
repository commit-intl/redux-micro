export type Dispatch<Requests> = <Action extends keyof Requests>(action: Action, payload: Requests[Action]) => void; 

export type Reducer<
  State,
  Requests,
  Action extends keyof Requests = keyof Requests,
  Payload extends Requests[Action] = Requests[Action]
> = (
  state: State,
  action: Action,
  payload: Payload,
  dispatch: Dispatch<Requests>
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
export type Selector<State, SelectorState> = (state: State) => SelectorState;

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

  select<SelctorState>(selector: Selector<State, SelctorState>) {
    let id: number;

    const observable = new Observable<SelctorState>(selector(this.state), () =>
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
    const requests: [action: keyof Requests, payload: Requests[keyof Requests]][] = [[action, payload]];
    let synchrounous = true;
    const smartDispatch = (action: keyof Requests, payload: Requests[keyof Requests]) => synchrounous ? requests.push([action, payload]) : this.dispatch(action, payload);
    let i = 0;

    while (i < requests.length) {
      const request = requests[i];
      state = this.reducers[request[0]](state, request[0], request[1], smartDispatch);
      this.logger?.(state, request[0], request[1]);
      i++;
    }

    synchrounous = false;

    this.setState(state);
  }
}
