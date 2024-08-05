/**
 * Internal dependencies
 */
import { getMediaTypeFromMimeType } from '../';

describe( 'getMediaTypeFromMimeType', () => {
	it.each( [
		[ 'image/jpeg', 'image' ],
		[ 'video/mp4', 'video' ],
		[ 'application/pdf', 'pdf' ],
	] )( 'for mime type %s returns media type %s', ( mimeType, mediaType ) => {
		expect( getMediaTypeFromMimeType( mimeType ) ).toStrictEqual(
			mediaType
		);
	} );
} );
