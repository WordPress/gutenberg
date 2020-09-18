/**
 * Internal dependencies
 */
import blockquoteNormaliser from '../blockquote-normaliser';
import { deepFilterHTML } from '../utils';

describe( 'blockquoteNormaliser', () => {
	it( 'should normalise blockquote', () => {
		const input = '<blockquote>test</blockquote>';
		const output = '<blockquote><p>test</p></blockquote>';
		expect( deepFilterHTML( input, [ blockquoteNormaliser ] ) ).toEqual(
			output
		);
	} );
} );
