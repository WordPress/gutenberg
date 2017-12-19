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

	it( 'should omit disallowed block types', () => {
		return blockAutocompleter( {
			allowedBlockTypes: [ 'core/baz', 'core/bar' ],
		} ).getOptions().then( ( options ) => {
			expect( options ).toHaveLength( 2 );
			expect( options[ 0 ] ).toMatchObject( {
				keywords: [ 'baz' ],
				value: 'core/baz',
			} );
			expect( options[ 1 ] ).toMatchObject( {
				keywords: [ 'bar' ],
				value: 'core/bar',
			} );
		} );
	} );
} );
