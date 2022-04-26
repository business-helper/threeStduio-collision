import { combineReducers } from "redux";

// reducer import
import modelReducer from "./modelReducer";

// ==============================|| COMBINE REDUCER ||============================== //

const reducer = combineReducers({
  model: modelReducer,
});

export default reducer;
