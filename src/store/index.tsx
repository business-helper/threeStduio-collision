import { createStore } from "redux";
import reducer from "./reducer";
import StateLoader from "./state.loader";

// ==============================|| REDUX - MAIN STORE ||============================== //

const stateLoader = new StateLoader();

const store = createStore(reducer, stateLoader.loadState());
const persister = "Free";

store.subscribe(() => {
  stateLoader.saveState(store.getState());
});
export { store, persister };
