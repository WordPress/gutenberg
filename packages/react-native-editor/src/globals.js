/**
 * External dependencies
 */
// This library works as a polyfill for the global crypto.getRandomValues which is needed by `uuid` version 7.0.0
import 'react-native-get-random-values';
import jsdom from 'jsdom-jscore-rn';
import jsdomLevel1Core from 'jsdom-jscore-rn/lib/jsdom/level1/core';
import 'react-native-url-polyfill/auto';

/**
 * Babel polyfills
 */
import 'core-js/features/array/flat-map';

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
		createElement, // Load the element creation function, needed by Gutenberg-web.
	},
};

const doc = jsdom.html( '', null, null );

// Inject a simple version of the missing createHTMLDocument method that `hpq` depends on.
doc.implementation.createHTMLDocument = function ( html ) {
	return jsdom.html( html, null, null );
};

// `hpq` depends on `document` be available globally.
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

global.window.navigator.userAgent = global.window.navigator.userAgent ?? '';

// Leverages existing console polyfill from react-native.
global.nativeLoggingHook = nativeLoggingHook;
