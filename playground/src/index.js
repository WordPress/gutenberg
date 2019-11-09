/**
 * External dependencies
 */
import 'react-hot-loader';

/**
 * WordPress dependencies
 */
// This shouldn't be necessary
import '@wordpress/editor';
import '@wordpress/format-library';

import { registerCoreBlocks } from '@wordpress/block-library';
import { render } from '@wordpress/element';

/* eslint-disable no-restricted-syntax */
import '@wordpress/components/build-style/style.css';
import '@wordpress/block-editor/build-style/style.css';
import '@wordpress/block-library/build-style/style.css';
import '@wordpress/block-library/build-style/editor.css';
import '@wordpress/block-library/build-style/theme.css';
import '@wordpress/format-library/build-style/style.css';
/* eslint-enable no-restricted-syntax */

/**
 * Internal dependencies
 */
import App from './app';

import './style.scss';

registerCoreBlocks();
render( <App />, document.querySelector( '#app' ) );

if ( module.hot ) {
	module.hot.accept();
}
