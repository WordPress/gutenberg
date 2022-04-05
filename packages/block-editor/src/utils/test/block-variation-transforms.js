/**
 * Internal dependencies
 */
import { __experimentalGetMatchingVariation as getMatchingVariation } from '../block-variation-transforms';

describe( 'getMatchingVariation', () => {
	describe( 'should not find a match', () => {
		it( 'when no variations or attributes passed', () => {
			expect(
				getMatchingVariation( null, { content: 'hi' } )
			).toBeUndefined();
			expect( getMatchingVariation( {} ) ).toBeUndefined();
		} );
		it( 'when no variation matched', () => {
			const variations = [
				{ name: 'one', attributes: { level: 1 } },
				{ name: 'two', attributes: { level: 2 } },
			];
			expect(
				getMatchingVariation( { level: 4 }, variations )
			).toBeUndefined();
		} );
		it( 'when more than one match found', () => {
			const variations = [
				{ name: 'one', attributes: { level: 1 } },
				{ name: 'two', attributes: { level: 1, content: 'hi' } },
			];
			expect(
				getMatchingVariation(
					{ level: 1, content: 'hi', other: 'prop' },
					variations
				)
			).toBeUndefined();
		} );
		it( 'when variation is a superset of attributes', () => {
			const variations = [
				{ name: 'one', attributes: { level: 1, content: 'hi' } },
			];
			expect(
				getMatchingVariation( { level: 1, other: 'prop' }, variations )
			).toBeUndefined();
		} );
		it( 'when isActive uses different logic to attributes, but attributes match', () => {
			const variations = [
				{
					name: 'one',
					attributes: { level: 1, content: 'hi' },
					isActive: ( blockAttributes ) => ! blockAttributes.level,
				},
			];

			expect(
				getMatchingVariation( { level: 1, content: 'hi' }, variations )
			).toBeUndefined();
		} );
	} );
	describe( 'should find a match', () => {
		it( 'when variation has one attribute', () => {
			const variations = [
				{ name: 'one', attributes: { level: 1 } },
				{ name: 'two', attributes: { level: 2 } },
			];
			expect(
				getMatchingVariation(
					{ level: 2, content: 'hi', other: 'prop' },
					variations
				).name
			).toEqual( 'two' );
		} );
		it( 'when variation has many attributes', () => {
			const variations = [
				{ name: 'one', attributes: { level: 1, content: 'hi' } },
				{ name: 'two', attributes: { level: 2 } },
			];
			expect(
				getMatchingVariation(
					{ level: 1, content: 'hi', other: 'prop' },
					variations
				).name
			).toEqual( 'one' );
		} );
		it( 'when isActive uses different logic to attributes, and attributes do not match', () => {
			const variations = [
				{
					name: 'one',
					attributes: { level: 1, content: 'hi' },
					isActive: ( blockAttributes ) => ! blockAttributes.level,
				},
			];

			expect(
				getMatchingVariation( { content: 'hi' }, variations ).name
			).toEqual( 'one' );
		} );

		it( 'when isActive uses different logic to attributes, and attributes do match', () => {
			const variations = [
				{
					name: 'one',
					attributes: { level: 1, content: 'hi' },
					isActive: ( blockAttributes ) =>
						! blockAttributes.level || blockAttributes.level === 1,
				},
			];

			expect(
				getMatchingVariation( { level: 1, content: 'hi' }, variations )
					.name
			).toEqual( 'one' );
		} );
	} );
} );
