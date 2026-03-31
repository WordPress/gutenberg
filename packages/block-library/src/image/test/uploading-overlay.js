/**
 * Internal dependencies
 */
import { getOperationLabel } from '../uploading-overlay';

describe( 'getOperationLabel', () => {
	it.each( [
		[ 'PREPARE', 'Preparing…' ],
		[ 'UPLOAD', 'Uploading…' ],
		[ 'RESIZE_CROP', 'Resizing…' ],
		[ 'ROTATE', 'Rotating…' ],
		[ 'TRANSCODE_IMAGE', 'Compressing…' ],
		[ 'THUMBNAIL_GENERATION', 'Generating thumbnails…' ],
		[ 'FINALIZE', 'Finalizing…' ],
	] )(
		'should return correct label for %s operation',
		( operation, expected ) => {
			expect( getOperationLabel( operation ) ).toBe( expected );
		}
	);

	it( 'should return Processing… for undefined operation', () => {
		expect( getOperationLabel( undefined ) ).toBe( 'Processing…' );
	} );

	it( 'should return Processing… for unknown operation', () => {
		expect( getOperationLabel( 'UNKNOWN_OP' ) ).toBe( 'Processing…' );
	} );
} );
