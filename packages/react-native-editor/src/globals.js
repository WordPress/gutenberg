/**
 * External dependencies
 */
// This library works as a polyfill for the global crypto.getRandomValues which is needed by `uuid` version 7.0.0
import 'react-native-get-random-values';
import jsdom from 'jsdom-jscore-rn';
import jsdomLevel1Core from 'jsdom-jscore-rn/lib/jsdom/level1/core';

/**
 * WordPress dependencies
 */
import { nativeLoggingHook } from '@wordpress/react-native-bridge';
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */

/**
 * Import for side-effects: Patches for jsdom-jscore, mostly to implement
 * functions that are called from Gutenberg code paths, where a more full DOM
 * implementation is expected (in the browser environment).
 *
 * More details are available within the comments in the file.
 */
import './jsdom-patches';

global.wp = {
	element: {
		createElement, // load the element creation function, needed by Gutenberg-web
	},
};

const doc = jsdom.html( '', null, null );

// inject a simple version of the missing createHTMLDocument method that `hpq` depends on
doc.implementation.createHTMLDocument = function ( html ) {
	return jsdom.html( html, null, null );
};

// `hpq` depends on `document` be available globally
global.document = doc;

if ( ! global.window.Node ) {
	global.window.Node = jsdomLevel1Core.dom.level1.core.Node;
}

if ( ! global.window.matchMedia ) {
	global.window.matchMedia = () => ( {
		matches: false,
		addListener: () => {},
		removeListener: () => {},
	} );
}

global.window.navigator.userAgent = [];

// Leverages existing console polyfill from react-native
global.nativeLoggingHook = nativeLoggingHook;

// This provides a simple patch for the unimplemented URL.prototype.search
// getter - it removes any existing URL fragment, and returns the string
// following (and including) the first '?'
// This is needed for certain middlewares used in api-fetch which process URL
// parameters, and they are incorrectly merged when this is left unimplemented.
Object.defineProperties( global.URL.prototype, {
	search: {
		get() {
			const queryParameters = this._url
				.split( '#' )[ 0 ]
				.split( '?' )
				.slice( 1 )
				.join( '?' );
			return queryParameters ? `?${ queryParameters }` : '';
		},
	},
} );
