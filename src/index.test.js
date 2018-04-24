const Store = require('./index.js');

let store;

const state = { a: 123, b: { test: 'string' } };

const actions = {
  'clear': 'clear',
  'add': 'add',
  'effect': 'effect',
  'effect__chain': 'effect__chain',
  'effect__chainless': 'effect__chainless',
};

const reducers = [
  {
    actions: [actions.clear],
    target: 'a',
    func: (action, payload, state) => {
      return 0;
    }
  },
  {
    actions: [actions.clear],
    target: 'b',
    func: (action, payload, state) => {
      return {};
    }
  },
  {
    actions: [actions.add],
    target: 'a',
    func: (action, payload, state) => {
      return state + payload;
    }
  }
];

const effects = [
  {
    actions: [actions.effect],
    func: (action, payload, callback) => {
      return callback([{ action: actions.add, payload: 1 }]);
    }
  },
  {
    actions: [actions.effect__chainless],
    func: (action, payload, callback) => {
      return callback();
    }
  },
  {
    actions: [actions.effect__chain],
    func: (action, payload, callback) => {
      return callback([
        { action: actions.effect },
        { action: actions.effect },
        { action: actions.add, payload: 3 }
      ]);
    }
  }
];

let result = [];

const logToResult = (action, payload, state) => {
  result.push({ action, payload, state });
};

beforeEach(() => {
  result = [];
  store = new Store(
    state,
    actions,
    reducers,
    effects,
    logToResult
  );
});


describe("store", () => {

  it('initialize', () => {
    expect(store.state).toEqual(state);
    expect(store.actions).toEqual(actions);
    expect(store.logger).toEqual(logToResult);
    expect(store.id).toEqual(0);
    expect(store.observers).toEqual({});
  });

  it('reducer', () => {
    store.dispatch(actions.add, 1);
    store.dispatch(actions.add, 2);

    expect(result).toEqual([
      { action: actions.add, payload: 1, state: { ...state, a: 124 } },
      { action: actions.add, payload: 2, state: { ...state, a: 126 } }
    ]);

    store.dispatch(actions.clear);
    expect(store.state).toEqual({ a: 0, b: {} });
  });

  it('effect', () => {
    store.dispatch(actions.effect);
    expect(result).toEqual([
      { action: actions.effect, payload: undefined, state: { ...state, a: 123 } },
      { action: actions.add, payload: 1, state: { ...state, a: 124 } },
    ]);
  });

  it('effect chain', () => {
    store.dispatch(actions.effect__chain);
    expect(result).toEqual([
      { action: actions.effect__chain, payload: undefined, state: { ...state, a: 123 } },
      { action: actions.add, payload: 3, state: { ...state, a: 126 } },
      { action: actions.effect, payload: undefined, state: { ...state, a: 126 } },
      { action: actions.add, payload: 1, state: { ...state, a: 127 } },
      { action: actions.effect, payload: undefined, state: { ...state, a: 127 } },
      { action: actions.add, payload: 1, state: { ...state, a: 128 } },
    ]);
  });

  it('effect chainless', () => {
    store.dispatch(actions.effect__chainless);
    expect(result).toEqual([
      { action: actions.effect__chainless, payload: undefined, state },
    ]);
  });

  it('observers', () => {

    store.logger = undefined;
    function stumpA(state) {
      result.push({stumpA: state});
    }

    function stumpB(state) {
      result.push({stumpB: state});
    }

    let listener0 = store.listen('a', stumpA);
    let listener1 = store.listen('b', stumpA);
    let listener2 = store.listen('b', stumpB);

    expect(store.observers).toEqual({
      a: { 0: stumpA },
      b: { 1: stumpA, 2: stumpB },
    });

    store.dispatch(actions.add, 1);
    store.dispatch(actions.clear);
    expect(result).toEqual([
      {stumpA: 124},
      {stumpA: 0},
      {stumpA: {}},
      {stumpB: {}},
    ]);

    result = [];

    store.removeListener(listener0);
    store.removeListener(listener1);
    store.removeListener(listener2);
    expect(store.observers).toEqual({
      a: {},
      b: {},
    });

    store.dispatch(actions.add, 21203);
    expect(result).toEqual([]);
  });
}); 