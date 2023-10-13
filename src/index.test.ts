import { beforeEach, describe, expect, it } from "@jest/globals";
import { Logger, ReducerMap, Store } from "./index";

type State = {
  a: number;
  b: Record<string, string>;
};

const initialState: State = { a: 123, b: { test: "string" } };

enum Action {
  clear = "clear",
  add = "add",
  effect = "effect",
  effect__chain = "effect__chain",
  effect__chainless = "effect__chainless",
  effect__async = "effect__async"
}

type Requests = {
  [Action.clear]: undefined;
  [Action.add]: number;
  [Action.effect]: undefined;
  [Action.effect__chain]: undefined;
  [Action.effect__chainless]: undefined;
  [Action.effect__async]: undefined;
};

const reducers: ReducerMap<State, Requests> = {
  [Action.clear]: (state, action, payload) => {
    return { ...state, a: 0, b: {} };
  },
  [Action.add]: (state, action, payload) => {
    return { ...state, a: state.a + payload };
  },
  [Action.effect]: (state, action, payload, dispatch) => {
    dispatch(Action.add, 1);
    return state;
  },
  [Action.effect__chainless]: (state, action, payload, dispatch) => {
    return state;
  },
  [Action.effect__chain]: (state, action, payload, dispatch) => {
    dispatch(Action.effect, undefined);
    dispatch(Action.effect, undefined);
    dispatch(Action.add, 3);
    return state;
  },
  [Action.effect__async]: (state, action, payload, dispatch) => {
    setTimeout(() => {
      dispatch(Action.add, 3);
    }, 0);
    return state;
  }
};

let result: any[] = [];

const logger: Logger<State, Requests> = (state, action, payload) => {
  result.push({ state, action, payload });
};

let store: Store<State, Requests>;

beforeEach(() => {
  result = [];
  store = new Store(initialState, reducers, logger);
});

describe("store", () => {
  it("initialize", () => {
    expect(store.getState()).toEqual(initialState);
    expect(store.nextObserverId).toEqual(1);
    expect(store.observers).toEqual({});
  });

  it("close", () => {
    store.subscribe(console.log);
    store.close();
    expect(store.observers).toEqual({});
  });

  it("reducer", () => {
    store.dispatch(Action.add, 1);
    store.dispatch(Action.add, 2);

    expect(result).toEqual([
      { action: Action.add, payload: 1, state: { ...initialState, a: 124 } },
      { action: Action.add, payload: 2, state: { ...initialState, a: 126 } }
    ]);

    store.dispatch(Action.clear, undefined);
    expect(store.getState()).toEqual({ a: 0, b: {} });
  });

  it("effect", () => {
    store.dispatch(Action.effect, undefined);
    expect(result).toEqual([
      {
        action: Action.effect,
        payload: undefined,
        state: { ...initialState, a: 123 }
      },
      { action: Action.add, payload: 1, state: { ...initialState, a: 124 } }
    ]);
  });

  it("effect chain", () => {
    store.dispatch(Action.effect__chain, undefined);
    expect(result).toEqual([
      {
        action: Action.effect__chain,
        payload: undefined,
        state: initialState
      },
      {
        action: Action.effect,
        payload: undefined,
        state: initialState
      },
      {
        action: Action.effect,
        payload: undefined,
        state: initialState
      },
      {
        action: Action.add,
        payload: 3,
        state: { ...initialState, a: initialState.a + 3 }
      },
      {
        action: Action.add,
        payload: 1,
        state: { ...initialState, a: initialState.a + 4 }
      },
      {
        action: Action.add,
        payload: 1,
        state: { ...initialState, a: initialState.a + 5 }
      }
    ]);
  });

  it("effect chainless", () => {
    store.dispatch(Action.effect__chainless, undefined);
    expect(result).toEqual([
      {
        action: Action.effect__chainless,
        payload: undefined,
        state: initialState
      }
    ]);
  });

  it("effect async", async () => {
    store.dispatch(Action.effect__async, undefined);
    expect(result).toEqual([
      {
        action: Action.effect__async,
        payload: undefined,
        state: initialState
      }
    ]);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result).toEqual([
      {
        action: Action.effect__async,
        payload: undefined,
        state: initialState
      },
      {
        action: Action.add,
        payload: 3,
        state: { ...initialState, a: initialState.a + 3 }
      }
    ]);
  });

  it("observers", () => {
    store.logger = undefined;
    function stumpVoid(state: State) {}

    function stumpA(state: State["a"]) {
      result.push({ stumpA: state });
    }

    function stumpRoot(state: State) {
      result.push({ stumpRoot: state });
    }

    let listener0 = store.subscribe(stumpVoid);
    let listener1 = store.subscribe(stumpRoot);

    store.unsubscribe(listener0);

    expect(store.observers).toEqual({
      2: stumpRoot
    });

    let selectA = store.select(state => state.a);
    selectA.subscribe(stumpA);

    store.dispatch(Action.add, 1);
    store.dispatch(Action.clear, undefined);
    expect(result).toEqual([
      { stumpRoot: { ...initialState, a: initialState.a + 1 } },
      { stumpA: initialState.a + 1 },
      { stumpRoot: { a: 0, b: {} } },
      { stumpA: 0 }
    ]);

    result = [];
    let testState = { a: 1337, b: { yee: "haa" } };
    store.setState(testState);
    expect(result).toEqual([{ stumpRoot: testState }, { stumpA: testState.a }]);
    expect(store.getState()).toEqual(testState);

    result = [];
    store.unsubscribe(listener1);
    selectA.close();
    expect(store.observers).toEqual({});

    store.dispatch(Action.add, 21203);
    expect(result).toEqual([]);
  });
});
