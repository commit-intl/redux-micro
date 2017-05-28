
const store = function (state, reducers, effects) {
  var addArrayTo = (array, target) => {
    array.forEach(element => {
      element.actions.forEach(action => {
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
  effects && addArrayTo(effects, this.r);
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
    for (let targets of this.o) {
      delete targets[id];
    }
  },

  dispatch: function (action, payload) {
    if (this.r[action]) {
      this.r[action].forEach(reducer => {
        this.s = Object.assign({}, this.s, {[reducer.target]: reducer.func(payload, this.s[reducer.target])});
        if (this.o[reducer.target]) {
          for (let id in this.o[reducer.target]) {
            this.o[reducer.target][id](this.s[reducer.target]);
          }
        }
      });
    }
    if (this.e[action]) {
      this.e[action].forEach(effect => {
        effect.func(payload, actions => actions.forEach(a => this.dispatch(a.action, a.payload)));
      });
    }
  }
};

module.exports = store;