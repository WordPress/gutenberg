/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import listMerger from '../list-merger';
import { deepFilterHTML } from '../utils';

describe( 'listMerger', () => {
	it( 'should merge lists', () => {
		const input = '<ul><li>one</li></ul><ul><li>two</li></ul>';
		const output = '<ul><li>one</li><li>two</li></ul>';
		equal( deepFilterHTML( input, [ listMerger ] ), output );
	} );

	it( 'should not merge lists if it has more than one item', () => {
		const input = '<ul><li>one</li></ul><ul><li>two</li><li>three</li></ul>';
		equal( deepFilterHTML( input, [ listMerger ] ), input );
	} );

	it( 'should not merge list if the type is different', () => {
		const input = '<ul><li>one</li></ul><ol><li>two</li></ol>';
		equal( deepFilterHTML( input, [ listMerger ] ), input );
	} );

	it( 'should not merge lists if there is something in between', () => {
		const input = '<ul><li>one</li></ul><p></p><ul><li>two</li></ul>';
		equal( deepFilterHTML( input, [ listMerger ] ), input );
	} );
} );
