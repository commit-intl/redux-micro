const Store = function (state, actions, reducers, effects, logger) {
  const addArrayTo = function (array, target) {
    for (let i in array) {
      for (let j in array[i].actions) {
        j = array[i].actions[j];
        if (target[j]) {
          target[j].push(array[i]);
        } else {
          target[j] = [array[i]];
        }
      }
    }
  };

  this.logger = logger;
  this.state = state;
  this.actions = actions;
  this.reducers = {};
  this.effects = {};
  reducers && addArrayTo(reducers, this.reducers);
  effects && addArrayTo(effects, this.effects);
  this.observers = {};
  this.id = 0;
};

Store.prototype = {
  subscribe: function (target, callback) {
    if (!this.observers[target])
      this.observers[target] = {};
    this.observers[target][this.id] = callback;
    callback(this.state[target]);
    return this.id++;
  },

  unsubscribe: function (id) {
    for (let i in this.observers) {
      if (this.observers[i] && this.observers[i][id]) {
        delete this.observers[i][id];
      }
    }
  },

  dispatch: function (action, payload) {
    const changes = {};
    const state = {};
    for (let i in this.state) {
      state[i] = this.state[i];
    }

    for (let i in this.reducers[action]) {
      let reducer = this.reducers[action][i];
      state[reducer.target] = changes[reducer.target] = reducer.func(action, payload, state[reducer.target]);
    }

    this.state = state;

    for (let i in changes) {
      for (let j in this.observers[i]) {
        this.observers[i][j](state[i]);
      }
    }

    if (this.logger) {
      this.logger(action, payload, state);
    }

    for (let i in this.effects[action]) {
      this.effects[action][i].func(action, payload, (actions) => {
        for (let i in actions) {
          this.dispatch(actions[i].action, actions[i].payload);
        }
      });
    }
  },

  setState(state) {
    this.state = state;
    for (let i in this.observers) {
      for(let j in this.observers[i]) {
        this.observers[i][j](state[i]);
      }
    }
  }
};

/* istanbul ignore next */
if (typeof module !== 'undefined') {
  module.exports = Store;
}
