/**
 * WordPress dependencies
 */
import { safeDecodeURI } from '@wordpress/url';

export const parseAudioUrl = ( src ) => {
	const decodedURI = safeDecodeURI( src );
	const fileName = decodedURI
		.split( '#' )
		.shift()
		.split( '?' )
		.shift()
		.split( '/' )
		.pop();

	const parts = fileName.split( '.' );
	const extension = parts.length === 2 ? parts.pop().toUpperCase() + ' ' : '';
	const title = parts.join( '.' );
	return { title, extension };
};
