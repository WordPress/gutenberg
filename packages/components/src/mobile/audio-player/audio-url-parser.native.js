/**
 * WordPress dependencies
 */
import { safeDecodeURI, getPath } from '@wordpress/url';

export const parseAudioUrl = ( src ) => {
	const fileName = getPath( safeDecodeURI( src ) ).split( '/' ).pop();
	const parts = fileName.split( '.' );
	const extension = parts.length === 2 ? parts.pop().toUpperCase() + ' ' : '';
	const title = parts.join( '.' );
	return { title, extension };
};
