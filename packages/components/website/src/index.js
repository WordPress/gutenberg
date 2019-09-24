/**
 * External dependencies
 */
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-syntax
import '@wordpress/components/build-style/style.css';

/**
 * Internal dependencies
 */
import App from './app';
import './styles/reset.css';
import './styles/global.css';
import './styles/variables.css';

ReactDOM.render( <App />, document.getElementById( 'root' ) );
