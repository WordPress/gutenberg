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
} );
