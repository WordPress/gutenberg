/**
 * Internal dependencies
 */
import { getFileExtension } from '../utils';

describe( 'getFileExtension', () => {
	it.each( [
		[ 'my-video.mp4', 'mp4' ],
		[ 'my.video.mp4', 'mp4' ],
		[ 'my-video', null ],
		[ '', null ],
	] )( 'for file name %s returns extension %s', ( fileName, baseName ) => {
		expect( getFileExtension( fileName ) ).toStrictEqual( baseName );
	} );
} );
