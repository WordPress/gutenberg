/**
 * Internal dependencies
 */
import { getMimeTypeFromExtension } from '../';

describe( 'getMimeTypeFromExtension', () => {
	it.each( [
		[ 'jpeg', 'image/jpeg' ],
		[ 'png', 'image/png' ],
		[ 'webp', 'image/webp' ],
		[ 'mp4', 'video/mp4' ],
		[ 'pdf', 'application/pdf' ],
		[ 'mp3', 'audio/mpeg' ],
		[ 'mpga', 'audio/mpeg' ],
		[ 'oga', 'audio/ogg' ],
	] )(
		'for mime type %s returns extension type %s',
		( extension, mimeType ) => {
			expect( getMimeTypeFromExtension( extension ) ).toStrictEqual(
				mimeType
			);
		}
	);
} );
