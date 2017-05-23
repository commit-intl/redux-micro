const addArrayTo = (array, target) => {
  array.forEach(element => {
    element.actions.forEach( action => {
      if(target[action])
        target[action].push(element);
      else
        target[action] = [element];
    });
  });
};

export default class Store {

  constructor(state = {}, reducers = null, effects = null) {
    this.state = state;
    this.reducers = {};
    this.effects = {};
    reducers && addArrayTo(reducers, this.reducers);
    effects && addArrayTo(effects, this.reducers);
    this.observers = {};
    this.nextId = 0;
  }

  listen(target, callback) {
    if(!this.observers[target])
      this.observers[target] = {};
    this.observers[target][this.nextId] = callback;
    return this.nextId++;
  }

  removeListener(id) {
    for(let targets of this.observers) {
      delete targets[id];
    }
  }

  dispatch(action, payload = null) {
    if(this.reducers[action]) {
      this.reducers[action].forEach(reducer => {
        this.state[reducer.target] = reducer.func(payload, this.state[reducer.target]);
        if(this.observers[reducer.target]) {
          for (let id in this.observers[reducer.target]){
            this.observers[reducer.target][id](this.state[reducer.target]);
          };
        }
      });
    }
    if(this.effects[action]) {
      this.effects[action].forEach(effect => {
        effect.func(payload, actions => actions.forEach(a => this.dispatch(a.action, a.payload)));
      });
    }
  }
};