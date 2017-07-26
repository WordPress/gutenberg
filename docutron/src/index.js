/**
 * External Dependencies
 */
import React from 'react';
import { render } from 'react-snapshot';
import 'prismjs/themes/prism.css';

/**
 * User Dependencies
 */
import 'config';

/**
 * Internal Dependencies
 */
import App from './components/app';
import './styles/main.css';

render( <App />, document.getElementById( 'root' ) );
