import logo from './logo.svg';
import './App.css';
import Home from './pages/Home'
import Auth from './pages/Auth'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard';
import { Route, Switch } from 'react-router-dom'
import { useAppState } from "./AppState"
import React from 'react'

export const App = (props) => {
  const { state, dispatch } = useAppState();
  React.useState(() => {
    const auth = JSON.parse(window.localStorage.getItem("auth"));
    if (auth) {
      dispatch({ type: "auth", payload: auth });
      props.history.push("/dashboard");
    } else {
      props.history.push("/");
    }
  }, []);

  return (
    <>
      <Route path="/" component={Nav}/>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/auth/:form" component={Auth} />
        <Route path="/dashboard" component={Dashboard} />
      </Switch>
    </>
  );
}

