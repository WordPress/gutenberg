/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import blockquoteNormaliser from '../blockquote-normaliser';
import { deepFilter } from '../utils';

describe( 'blockquoteNormaliser', () => {
	it( 'should normalise blockquote', () => {
		const input = '<blockquote>test</blockquote>';
		const output = '<blockquote><p>test</p></blockquote>';
		equal( deepFilter( input, [ blockquoteNormaliser ] ), output );
	} );
} );
