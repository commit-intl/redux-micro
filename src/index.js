const store = function (state, reducers, effects, pipe) {
  var addArrayTo = function (array, target) {
    var i = array.length;
    while (i--) {
      var e = array[i];
      var j = e.actions.length;
      while (j--) {
        var a = e.actions[j];
        if (target[a])
          target[a].push(e);
        else
          target[a] = [e];
      }
    }
  };

  this.pipe = pipe;
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
    if(this.pipe) {
      payload = this.pipe(action, payload);
    }
    var i = (this.reducers[action] || []).length;
    while (i--) {
      var reducer = this.reducers[action][i];
      var t = {};
      t[reducer.target] = reducer.func(action, payload, this.state[reducer.target]);
      this.state = Object.assign({}, this.state, t);
      if (this.observers[reducer.target]) {
        for (var id in this.observers[reducer.target]) {
          this.observers[reducer.target][id](this.state[reducer.target]);
        }
      }
    }
    i = (this.effects[action] || []).length;
    while (i--) {
      var effect = this.effects[action][i];
      effect.func(action, payload, function(dispatch) {
        return function (actions) {
          var i = (actions || []).length;
          while (i--) {
            dispatch(actions[i].action, actions[i].payload);
          }
        }
      }(this.dispatch));
    }
  }
};

module.exports = store;