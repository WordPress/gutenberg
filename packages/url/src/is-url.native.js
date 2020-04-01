/**
 * External dependencies
 */
import { URL } from 'react-native-url-polyfill';

/* eslint-disable jsdoc/valid-types */
/**
 * @type {typeof import('./is-url').isURL}
 */
/* eslint-enable */
export function isURL( url ) {
	// A URL can be considered value if the `URL` constructor is able to parse
	// it. The constructor throws an error for an invalid URL.
	try {
		new URL( url );
		return true;
	} catch ( error ) {
		return false;
	}
}
