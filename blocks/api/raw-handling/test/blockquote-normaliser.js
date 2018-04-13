/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import blockquoteNormaliser from '../blockquote-normaliser';
import { deepFilterHTML } from '../utils';

describe( 'blockquoteNormaliser', () => {
	it( 'should normalise blockquote', () => {
		const input = '<blockquote>test</blockquote>';
		const output = '<blockquote><p>test</p></blockquote>';
		equal( deepFilterHTML( input, [ blockquoteNormaliser ] ), output );
	} );

	it( 'should normalise blockquote containing inline wrapper tag', () => {
		const input = '<blockquote><h2>test</h2></blockquote>';
		const output = '<blockquote><p>test</p></blockquote>';
		equal( deepFilterHTML( input, [ blockquoteNormaliser ] ), output );
	} );

	it( 'should normalise blockquote containing multiple inline tags', () => {
		const input = '<blockquote><p>test</p><h1>test2</h1></blockquote>';
		const output = '<blockquote><p>test</p><p>test2</p></blockquote>';
		equal( deepFilterHTML( input, [ blockquoteNormaliser ] ), output );
	} );

	it( 'should normalise blockquote containing multiple inline tags and caption', () => {
		const input = '<blockquote><h1>test</h1><cite>cite</cite></blockquote>';
		const output = '<blockquote><p>test</p><cite>cite</cite></blockquote>';
		equal( deepFilterHTML( input, [ blockquoteNormaliser ] ), output );
	} );
} );
