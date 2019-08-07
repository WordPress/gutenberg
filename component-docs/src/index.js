/**
 * External dependencies
 */
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * WordPress dependencies
 */
/*eslint-disable */
import '@wordpress/components/build-style/style.css';
/*eslint-enable */

/**
 * Internal dependencies
 */
import App from './app';
import './styles/global.css';

ReactDOM.render( <App />, document.getElementById( 'root' ) );
