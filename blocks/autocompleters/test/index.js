/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import BlockIcon from '../../block-icon';
import { registerBlockType, unregisterBlockType, getBlockTypes } from '../../api';
import { blockAutocompleter } from '../';

describe( 'blockAutocompleter', () => {
	beforeEach( () => {
		registerBlockType( 'core/foo', {
			save: noop,
			category: 'common',
			title: 'foo',
			keywords: [ 'keyword' ],
		} );

		registerBlockType( 'core/bar', {
			save: noop,
			category: 'layout',
			title: 'bar',
		} );

		registerBlockType( 'core/baz', {
			save: noop,
			category: 'common',
			title: 'baz',
		} );
	} );

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should prioritize common blocks in options', () => {
		return blockAutocompleter( {} ).getOptions().then( ( options ) => {
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
					value: 'core/foo',
				},
				{
					keywords: [ 'baz' ],
					label: [
						'baz',
					],
					value: 'core/baz',
				},
				{
					keywords: [ 'bar' ],
					label: [
						'bar',
					],
					value: 'core/bar',
				},
			] );
		} );
	} );
} );
