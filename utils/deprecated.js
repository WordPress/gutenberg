/**
 * WordPress dependencies
 */
import * as blob from '@wordpress/blob';
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
