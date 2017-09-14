const store = function (state, reducers, effects) {
  var addArrayTo = function (array, target) {
    array.forEach(function (element) {
      element.actions.forEach(function (action) {
        if (target[action])
          target[action].push(element);
        else
          target[action] = [element];
      });
    });
  };

  this.state = state;
  this.reducers = {};
  this.effects = {};
  reducers && addArrayTo(reducers, this.reducers);
  effects && addArrayTo(effects, this.effects);
  this.observers = {};
  this.id = 0;
};

store.prototype = {
  listen: function (target, callback) {
    if (!this.observers[target])
      this.observers[target] = {};
    this.observers[target][this.id] = callback;
    return this.id++;
  },

  removeListener: function (id) {
    for (var targets in Object.keys(this.observers)) {
      delete this.observers[targets][id];
    }
  },

  dispatch: function (action, payload) {
    if (this.reducers[action]) {
      this.reducers[action].forEach(function (reducer) {
        var t = {};
        t[reducer.target] = reducer.func(action, payload, this.state[reducer.target]);
        this.state = Object.assign({}, this.state, t);
        if (this.observers[reducer.target]) {
          for (var id in this.observers[reducer.target]) {
            this.observers[reducer.target][id](this.state[reducer.target]);
          }
        }
      });
    }
    if (this.effects[action]) {
      this.effects[action].forEach(function (effect) {
        effect.func(action, payload, function (actions) {
          actions.forEach(function (a) {
            this.dispatch(a.action, a.payload);
          });
        });
      });
    }
  }
};

module.exports = store;