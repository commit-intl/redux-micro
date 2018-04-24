const Store = function (state, actions, reducers, effects, logger) {
  const addArrayTo = function (array, target) {
    let index = array.length;
    while (index--) {
      const entry = array[index];
      let actionIndex = entry.actions.length;
      while (actionIndex--) {
        let action_id = entry.actions[actionIndex];
        if (target[action_id])
          target[action_id].push(entry);
        else
          target[action_id] = [entry];
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
  listen: function (target, callback) {
    if (!this.observers[target])
      this.observers[target] = {};
    this.observers[target][this.id] = callback;
    return this.id++;
  },

  removeListener: function (id) {
    for (let targets in this.observers) {
      if (this.observers[targets] && this.observers[targets][id]) {
        delete this.observers[targets][id];
      }
    }
  },

  dispatch: function (action, payload) {
    let i = (this.reducers[action] || []).length;
    while (i--) {
      const reducer = this.reducers[action][i];
      const t = {};
      t[reducer.target] = reducer.func(action, payload, this.state[reducer.target]);
      this.state = { ...this.state, ...t };
      if (this.observers[reducer.target]) {
        for (const id in this.observers[reducer.target]) {
          this.observers[reducer.target][id](this.state[reducer.target]);
        }
      }
    }
    if (this.logger) {
      this.logger(action, payload, this.state);
    }
    i = (this.effects[action] || []).length;
    while (i--) {
      this.effects[action][i].func(action, payload, (actions) => {
        let i = (actions || []).length;
        while (i--) {
          this.dispatch(actions[i].action, actions[i].payload);
        }
      });
    }
  }
};

/* istanbul ignore next */
if (typeof module !== 'undefined') {
  module.exports = Store;
}