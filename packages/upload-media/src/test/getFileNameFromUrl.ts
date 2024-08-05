/**
 * Internal dependencies
 */
import { getFileNameFromUrl } from '../utils';

describe( 'getFileNameFromUrl', () => {
	it.each( [
		[ 'https://example.com/', 'unnamed' ],
		[ 'https://example.com/photo.jpeg', 'photo.jpeg' ],
		[ 'https://example.com/path/to/video.mp4', 'video.mp4' ],
	] )( 'for %s returns %s', ( url, fileName ) => {
		expect( getFileNameFromUrl( url ) ).toBe( fileName );
	} );
} );
