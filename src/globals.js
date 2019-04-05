/** @flow
 * @format */

/**
 * External dependencies
 */
import jsdom from 'jsdom-jscore';
import jsdomLevel1Core from 'jsdom-jscore/lib/jsdom/level1/core';
import { nativeLoggingHook } from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
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
doc.implementation.createHTMLDocument = function( html ) {
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

// Leverages existing console polyfill from react-native
global.nativeLoggingHook = nativeLoggingHook;
