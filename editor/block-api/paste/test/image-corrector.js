/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import imageCorrector from '../image-corrector';
import { deepFilter } from '../utils';

describe( 'imageCorrector', () => {
	it( 'should correct image source', () => {
		const input = '<img src="file:LOW-RES.png">';
		const output = '<img src="">';
		equal( deepFilter( input, [ imageCorrector ] ), output );
	} );

	it( 'should remove trackers', () => {
		const input = '<img src="" height="1" width="1">';
		const output = '';
		equal( deepFilter( input, [ imageCorrector ] ), output );
	} );
} );
