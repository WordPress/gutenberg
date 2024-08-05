/**
 * Internal dependencies
 */
import { getExtensionFromMimeType } from '../';

describe( 'getExtensionFromMimeType', () => {
	it.each( [
		[ 'image/jpeg', 'jpeg' ],
		[ 'image/png', 'png' ],
		[ 'image/webp', 'webp' ],
		[ 'video/mp4', 'mp4' ],
		[ 'application/pdf', 'pdf' ],
		[ 'audio/mp3', 'mp3' ],
		[ 'audio/mpeg', 'mpga' ],
		[ 'audio/ogg', 'oga' ],
	] )(
		'for mime type %s returns extension type %s',
		( mimeType, extension ) => {
			expect( getExtensionFromMimeType( mimeType ) ).toStrictEqual(
				extension
			);
		}
	);
} );
