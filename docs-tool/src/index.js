import React from 'react';
import ReactDOM from 'react-dom';
import 'prismjs';
import 'prismjs/themes/prism.css';

import 'config';

import App from './components/App';
import registerServiceWorker from './registerServiceWorker';
import './styles/main.css';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
