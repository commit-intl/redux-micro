# redux-micro
[![Build Status](https://travis-ci.org/coding-intl/micro-redux.svg?branch=master)](https://travis-ci.org/coding-intl/micro-redux)
[![Coverage Status](https://coveralls.io/repos/github/coding-intl/redux-micro/badge.svg?branch=master)](https://coveralls.io/github/coding-intl/redux-micro?branch=master)

tiny redux store with effects support

**0.6kB** _(minified + gzipped)_

``` bash
npm install -S redux-mikro
```


## Usage
### Store
#### constructor
| parameter | type |
|---------|--------|
| state | {} |
| actions | {} |
| reducers | [Reducer](#reducer)\[\] |
| effects | [Effect](#effect)\[\] |
| logger | (action: _string_, payload: _any_, state: _any_) => void |

#### methods
| method | parameters | returns |
|--------|------------|---------|
| dispatch | action: _string_, payload: _any_ | void |
| subscribe | targetBranch: _string_, callback: _(state) => void_ | int |
| unsubscribe | id: _int_ | void |


### Reducer
Object with following attributes:

| attribute | type | description |
|-----------|------|-------------|
| target    | string | store branch to be effected
| actions | string[] | actions on which this reducer will be triggered |
| func | (action: _string_, payload: _any_, state: _any_) => any | reducer func that shall be pure |

### Effect
Object with following attributes:

| attribute | type | description |
|-----------|------|-------------|
| actions | string[] | actions on which this reducer will be triggered |
| func | (action: _string_, payload: _any_, callback: _({action: string, payload: any}\[\]) => void_ | effect func that calls the callback with all successive dispatch calls |

