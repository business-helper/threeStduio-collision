const stateKey = "http://three-sutdio.ui:state";

export default class StateLoader {
  loadState = () => {
    try {
      const serializedState = localStorage.getItem(stateKey);

      if (serializedState === null) {
        return this.initializeState();
      }

      return JSON.parse(serializedState);
    } catch (err) {
      return this.initializeState();
    }
  };

  saveState = (state: any) => {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(stateKey, serializedState);
    } catch (err) {
      console.log(err);
    }
  };

  initializeState = () => {
    return {};
  };
}
