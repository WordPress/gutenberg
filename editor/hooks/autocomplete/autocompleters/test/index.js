/**
 * WordPress dependencies
 */
import { BlockIcon } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { blockAutocompleter } from '../';

describe( 'blockAutocompleter', () => {
	it( 'should prioritize common blocks in options', () => {
		const baz = { name: 'core/baz', title: 'baz' };
		const bar = { name: 'core/bar', title: 'bar' };
		const foo = { name: 'core/foo', title: 'foo', category: 'common', keywords: [ 'keyword' ] };

		return blockAutocompleter( { items: [ baz, bar, foo ] } ).getOptions().then( ( options ) => {
			// Exclude React element from label for assertion, since we can't
			// easily test equality.
			options = options.map( ( option ) => {
				expect( option.label[ 0 ].type ).toBe( BlockIcon );

				return {
					...option,
					label: option.label.slice( 1 ),
				};
			} );

			expect( options ).toEqual( [
				{
					keywords: [ 'keyword', 'foo' ],
					label: [
						'foo',
					],
					value: foo,
				},
				{
					keywords: [ 'baz' ],
					label: [
						'baz',
					],
					value: baz,
				},
				{
					keywords: [ 'bar' ],
					label: [
						'bar',
					],
					value: bar,
				},
			] );
		} );
	} );
} );
