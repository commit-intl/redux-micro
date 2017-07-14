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

  this.s = state; // STATE
  this.r = {}; // REDUCERS
  this.e = {}; // EFFECTS
  reducers && addArrayTo(reducers, this.r);
  effects && addArrayTo(effects, this.e);
  this.o = {}; // OBSERVERS
  this.i = 0; // NEXT ID
};

store.prototype = {
  listen: function (target, callback) {
    if (!this.o[target])
      this.o[target] = {};
    this.o[target][this.i] = callback;
    return this.i++;
  },

  removeListener: function (id) {
    for (let targets in Object.keys(this.o)) {
      delete this.o[targets][id];
    }
  },

  dispatch: function (action, payload) {
    if (this.r[action]) {
      this.r[action].forEach(function (reducer) {
        var t = {};
        t[reducer.target] = reducer.func(action, payload, this.s[reducer.target]);
        this.s = Object.assign({}, this.s, t);
        if (this.o[reducer.target]) {
          for (let id in this.o[reducer.target]) {
            this.o[reducer.target][id](this.s[reducer.target]);
          }
        }
      });
    }
    if (this.e[action]) {
      this.e[action].forEach(function (effect) {
        effect.func(action, payload, function (actions) {
          actions.forEach(function (a) {
            this.dispatch(a.action, a.payload)
          });
        });
      });
    }
  }
};

module.exports = store;