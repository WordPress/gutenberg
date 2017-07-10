import React from 'react'; // eslint-disable-line no-unused-vars
import { render } from 'react-snapshot';
import 'prismjs/themes/prism.css';

import 'config';

import App from './components/App';
import registerServiceWorker from './registerServiceWorker';
import './styles/main.css';

render( <App />, document.getElementById( 'root' ) );
registerServiceWorker();
