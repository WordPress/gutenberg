/**
 * Internal dependencies
 */
import { canProcessWithVips } from '../utils';

describe( 'canProcessWithVips', () => {
	it.each( [
		[ 'image.jpg', 'image/jpeg', true ],
		[ 'image.jpeg', 'image/jpeg', true ],
		[ 'image.png', 'image/png', true ],
		[ 'image.gif', 'image/gif', true ],
		[ 'image.webp', 'image/webp', true ],
		[ 'image.avif', 'image/avif', true ],
		[ 'document.pdf', 'application/pdf', false ],
		[ 'video.mp4', 'video/mp4', false ],
		[ 'audio.mp3', 'audio/mpeg', false ],
		[
			'document.docx',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			false,
		],
		[ 'image.svg', 'image/svg+xml', false ],
		[ 'image.bmp', 'image/bmp', false ],
		[ 'image.tiff', 'image/tiff', false ],
	] )(
		'for file %s with type %s returns %s',
		( fileName, mimeType, expected ) => {
			const file = new File( [ '' ], fileName, { type: mimeType } );
			expect( canProcessWithVips( file ) ).toBe( expected );
		}
	);
} );
