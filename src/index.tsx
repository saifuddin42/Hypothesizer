import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/main/App';
import * as serviceWorker from './serviceWorker';
// import Button from 'react-bootstrap/Button';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Refresh from '@material-ui/icons/Refresh';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeHypothesizer } from './api/devtools';

initializeHypothesizer();

ReactDOM.render(
  <React.StrictMode>
    <Button
      onClick={() => window.location.reload()}
      variant="outlined"
      color="primary"
    > <Refresh/>
    </Button>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
