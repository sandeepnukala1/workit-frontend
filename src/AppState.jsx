import React, { useContext, useReducer } from "react"

// Init State
const initialState = {
    url: "https://workit-backend.herokuapp.com",
    token: null,
    username: null,
    tasks: null,
    statuses: null,
    newTask: {
        title: "",
        description: "",
        status: ""
    },
    editTask: {
        id: 0,
        title: "",
        description: "",
        status: ""
    },
    newStatus: {
        title: "",
    },
    editStatus: {
        id: 0,
        title: "",
    }
}

// Reducer
const reducer = (state, action) => {
    let newState;
    switch(action.type) {
        case "auth":
            newState = {...state, ...action.payload}
            return newState;
            break;
        case "logout":
            newState = {...state, token: null, username: null}
            window.localStorage.removeItem("auth")
            return newState;
            break;
        case "getTasks":
            newState = {...state, tasks: action.payload}
            return newState
            break;
        case "getStatuses":
            newState = {...state, statuses: action.payload}
            return newState
            break;
        case "select":
            newState = {...state, editTask: action.payload}
            return newState
            break;
        default: 
        return state
           break;
    }
}

////////////////////
// AppContext
////////////////////
const AppContext = React.createContext(null);

////////////////////
// AppState Component
////////////////////
export const AppState = (props) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {props.children}
    </AppContext.Provider>
  );
};

////////////////////
//useAppState hook
////////////////////

export const useAppState = () => {
  return React.useContext(AppContext);
};