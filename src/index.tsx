import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from 'react-router-dom';
import Buffer from "vue-buffer"
import { BigNumber } from 'bignumber.js';
window["Buffer"] = Buffer;

const oldPwd = (window as any).Math.pow;
(window as any).Math.pow = (x: any, y: any) => {
  const result = oldPwd(Number(x), Number(y))
  if (typeof x === "bigint") {
    return BigInt(result)
  }
  return result
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // <React.StrictMode>
  <Router>
    <App />
  </Router>
  // </React.StrictMode>

);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
