# redux-micro

[![Build Status](https://travis-ci.org/coding-intl/redux-micro.svg?branch=master)](https://travis-ci.org/coding-intl/redux-micro)
[![Coverage Status](https://coveralls.io/repos/github/coding-intl/redux-micro/badge.svg?branch=master)](https://coveralls.io/github/coding-intl/redux-micro?branch=master)

tiny redux store with effects support

**0.5kB** _(minified + gzipped)_

```bash
npm install -S redux-micro
yarn add redux-micro
```

## Usage

```ts
type State = {
  alpha: number;
  beta: Record<string, string>;
  gamma?: { isHappy?: boolean };
};

enum Action {
  clear = "clear",
  add = "add",
  set = "set",
  request_happy = "request_happy"
  request_happy_success = "request_happy_success"
}

type Requests = {
  [Action.clear]: undefined;
  [Action.add]: number;
  [Action.set]: { key: string; value: string };
  [Action.request_happy]: undefined;
  [Action.request_happy_success]: boolean;
};

const reducers: ReducerMap<State, Requests> = {
  [Action.clear]: (state, action, payload) => {
    return { ...state, a: 0, b: {} };
  },
  [Action.add]: (state, action, payload) => {
    return { ...state, a: state.a + payload };
  },
  [Action.set]: (state, action, payload) => {
    return { ...state, beta: { ...state.beta, [payload.key]: payload.value} };
  },
  [Action.request_happy]: (state, action, payload, dispatch) => {
    fetch("/api/is-happy").then(response => {
      if (response.ok) {
        dispatch(Action.request_happy_success, true);
      } else {
        dispatch(Action.request_happy_success, false);
      }
    }).catch(() => {
      dispatch(Action.request_happy_success, false);
    })
    return state;
  },
  [Action.request_happy_success]: (state, action, payload) => {
    return { ...state, gamma: {isHappy: payload} };
  },
};

const initialState: State = {
  alpha: 0,
  beta: {},
};

const store = new Store<State, Requests>(initialState, reducers);

store.subscribe((state, action, payload) => console.log(action, payload));

store.dispatch(Action.request_happy, undefined);
```
