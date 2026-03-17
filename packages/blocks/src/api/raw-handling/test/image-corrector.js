/**
 * Internal dependencies
 */
import imageCorrector from '../image-corrector';
import { deepFilterHTML } from '../utils';

describe( 'imageCorrector', () => {
	it( 'should correct image source', () => {
		const input = '<img src="file:LOW-RES.png">';
		const output = '<img src="">';
		expect( deepFilterHTML( input, [ imageCorrector ] ) ).toEqual( output );
	} );

	it( 'should remove trackers', () => {
		const input = '<img src="" height="1" width="1">';
		const output = '';
		expect( deepFilterHTML( input, [ imageCorrector ] ) ).toEqual( output );
	} );
} );
