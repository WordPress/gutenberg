/**
 * WordPress dependencies
 */
import * as blob from '@wordpress/blob';
import * as keycodesSource from '@wordpress/keycodes';
import originalDeprecated from '@wordpress/deprecated';

const wrapFunction = ( source, sourceName, version ) =>
	( functionName ) => ( ...args ) => {
		originalDeprecated( `wp.utils.${ functionName }`, {
			version,
			alternative: `wp.${ sourceName }.${ functionName }`,
			plugin: 'Gutenberg',
		} );
		return source[ functionName ]( ...args );
	};

// blob
const wrapBlobFunction = wrapFunction( blob, 'blob', '3.2' );
export const createBlobURL = wrapBlobFunction( 'createBlobURL' );
export const getBlobByURL = wrapBlobFunction( 'getBlobByURL' );
export const revokeBlobURL = wrapBlobFunction( 'revokeBlobURL' );

// deprecated
export function deprecated( ...params ) {
	originalDeprecated( 'wp.utils.deprecated', {
		version: '3.2',
		alternative: 'wp.deprecated',
		plugin: 'Gutenberg',
	} );

	return originalDeprecated( ...params );
}

// keycodes
const wrapKeycodeFunction = ( source, functionName ) => ( ...args ) => {
	originalDeprecated( `wp.utils.keycodes.${ functionName }`, {
		version: '3.4',
		alternative: `wp.keycodes.${ functionName }`,
		plugin: 'Gutenberg',
	} );
	return source( ...args );
};

const keycodes = { ...keycodesSource, rawShortcut: {}, displayShortcut: {}, isKeyboardEvent: {} };
const modifiers = [ 'primary', 'primaryShift', 'secondary', 'access' ];
keycodes.isMacOS = wrapKeycodeFunction( keycodes.isMacOS, 'isMacOS' );
modifiers.forEach( ( modifier ) => {
	keycodes.rawShortcut[ modifier ] = wrapKeycodeFunction( keycodesSource.rawShortcut[ modifier ], 'rawShortcut.' + modifier );
	keycodes.displayShortcut[ modifier ] = wrapKeycodeFunction( keycodesSource.displayShortcut[ modifier ], 'displayShortcut.' + modifier );
	keycodes.isKeyboardEvent[ modifier ] = wrapKeycodeFunction( keycodesSource.isKeyboardEvent[ modifier ], 'isKeyboardEvent.' + modifier );
} );

export { keycodes };
