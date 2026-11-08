import { describe, expect, it } from 'vitest';
import nonBreakingSpaceCorrector from '../non-breaking-space-corrector';
import { deepFilterHTML } from '../utils';

describe( 'nonBreakingSpaceCorrector', () => {
	it( 'should replace non-breaking spaces at the edges of a text node', () => {
		expect(
			deepFilterHTML( '<p>a&nbsp;<a href="#">b</a>&nbsp;c</p>', [
				nonBreakingSpaceCorrector,
			] )
		).toBe( '<p>a <a href="#">b</a> c</p>' );
	} );

	it( 'should replace a run of non-breaking spaces with one space', () => {
		expect(
			deepFilterHTML( '<p>a&nbsp;&nbsp;<strong>b</strong></p>', [
				nonBreakingSpaceCorrector,
			] )
		).toBe( '<p>a <strong>b</strong></p>' );
	} );

	it( 'should replace non-breaking spaces at the start and end of a block', () => {
		expect(
			deepFilterHTML( '<p>&nbsp;a&nbsp;</p>', [
				nonBreakingSpaceCorrector,
			] )
		).toBe( '<p> a </p>' );
	} );

	it( 'should keep non-breaking spaces that are all there is', () => {
		expect(
			deepFilterHTML( '<p>&nbsp;</p>', [ nonBreakingSpaceCorrector ] )
		).toBe( '<p>&nbsp;</p>' );
	} );

	it( 'should replace non-breaking spaces between elements', () => {
		expect(
			deepFilterHTML( '<p><a href="#">a</a>&nbsp;<a href="#">b</a></p>', [
				nonBreakingSpaceCorrector,
			] )
		).toBe( '<p><a href="#">a</a> <a href="#">b</a></p>' );
	} );

	it( 'should keep non-breaking spaces inside text', () => {
		expect(
			deepFilterHTML( '<p>a&nbsp;b</p>', [ nonBreakingSpaceCorrector ] )
		).toBe( '<p>a&nbsp;b</p>' );
	} );

	it( 'should keep non-breaking spaces in preformatted text', () => {
		expect(
			deepFilterHTML( '<pre>a&nbsp;<b>b</b></pre>', [
				nonBreakingSpaceCorrector,
			] )
		).toBe( '<pre>a&nbsp;<b>b</b></pre>' );
	} );
} );
