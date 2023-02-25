/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import '../anchor';
import { immutableSet } from '../utils';

describe( 'immutableSet', () => {
	describe( 'handling falsy values properly', () => {
		it( 'should create a new object if `undefined` is passed', () => {
			const result = immutableSet( undefined, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'should create a new object if `null` is passed', () => {
			const result = immutableSet( null, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'should create a new object if `false` is passed', () => {
			const result = immutableSet( false, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'should create a new object if `0` is passed', () => {
			const result = immutableSet( 0, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'should create a new object if an empty string is passed', () => {
			const result = immutableSet( '', 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'should create a new object if a NaN is passed', () => {
			const result = immutableSet( NaN, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );
	} );

	describe( 'manages data assignment properly', () => {
		it( 'assigns value properly when it does not exist', () => {
			const result = immutableSet( {}, 'test', 1 );

			expect( result ).toEqual( { test: 1 } );
		} );

		it( 'overrides existing values', () => {
			const result = immutableSet( { test: 1 }, 'test', 2 );

			expect( result ).toEqual( { test: 2 } );
		} );

		describe( 'with array notation access', () => {
			it( 'assigns values at deeper levels', () => {
				const result = immutableSet( {}, [ 'foo', 'bar', 'baz' ], 5 );

				expect( result ).toEqual( { foo: { bar: { baz: 5 } } } );
			} );

			it( 'overrides existing values at deeper levels', () => {
				const result = immutableSet(
					{ foo: { bar: { baz: 1 } } },
					[ 'foo', 'bar', 'baz' ],
					5
				);

				expect( result ).toEqual( { foo: { bar: { baz: 5 } } } );
			} );

			it( 'keeps other properties intact', () => {
				const result = immutableSet(
					{ foo: { bar: { baz: 1 } } },
					[ 'foo', 'bar', 'test' ],
					5
				);

				expect( result ).toEqual( {
					foo: { bar: { baz: 1, test: 5 } },
				} );
			} );
		} );
	} );

	describe( 'does not mutate the original object', () => {
		it( 'clones the object at the first level', () => {
			const input = {};
			const result = immutableSet( input, 'test', 1 );

			expect( result ).not.toBe( input );
		} );

		it( 'clones the object at deeper levels', () => {
			const input = { foo: { bar: { baz: 1 } } };
			const result = immutableSet( input, [ 'foo', 'bar', 'baz' ], 2 );

			expect( result ).not.toBe( input );
			expect( result.foo ).not.toBe( input.foo );
			expect( result.foo.bar ).not.toBe( input.foo.bar );
			expect( result.foo.bar.baz ).not.toBe( input.foo.bar.baz );
		} );
	} );
} );

describe( 'anchor', () => {
	const blockSettings = {
		category: 'text',
		title: 'block title',
	};

	describe( 'addAttribute()', () => {
		const registerBlockType = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		);

		it( 'should do nothing if the block settings do not define anchor support', () => {
			const settings = registerBlockType( blockSettings );

			expect( settings.attributes ).toBe( undefined );
		} );

		it( 'should assign a new anchor attribute depending on the value of the save property', () => {
			const saveDefinitions = [
				// The anchor attribute should be stored as a comment delimiter.
				{
					value: null,
					schema: {
						type: 'string',
					},
				},
				{
					value: () => null,
					schema: {
						type: 'string',
					},
				},
				{
					value: undefined,
					schema: {
						type: 'string',
					},
				},
				// The anchor attributes should be saved as part of the markup.
				{
					value: () => <div className="default" />,
					schema: {
						attribute: 'id',
						selector: '*',
						source: 'attribute',
						type: 'string',
					},
				},
			];

			saveDefinitions.forEach( ( { value, schema } ) => {
				const settings = registerBlockType( {
					...blockSettings,
					save: value,
					supports: {
						anchor: true,
					},
				} );
				expect( settings.attributes.anchor ).toEqual( schema );
			} );
		} );

		it( 'should not override attributes defined in settings', () => {
			const settings = registerBlockType( {
				...blockSettings,
				supports: {
					anchor: true,
				},
				attributes: {
					anchor: {
						type: 'string',
						default: 'testAnchor',
					},
				},
			} );

			expect( settings.attributes.anchor ).toEqual( {
				type: 'string',
				default: 'testAnchor',
			} );
		} );
	} );

	describe( 'addSaveProps', () => {
		const getSaveContentExtraProps = applyFilters.bind(
			null,
			'blocks.getSaveContent.extraProps'
		);

		it( 'should do nothing if the block settings do not define anchor support', () => {
			const attributes = { anchor: 'foo' };
			const extraProps = getSaveContentExtraProps(
				{},
				blockSettings,
				attributes
			);

			expect( extraProps ).not.toHaveProperty( 'id' );
		} );

		it( 'should inject anchor attribute ID', () => {
			const attributes = { anchor: 'foo' };
			const extraProps = getSaveContentExtraProps(
				{},
				{
					...blockSettings,
					supports: {
						anchor: true,
					},
				},
				attributes
			);

			expect( extraProps.id ).toBe( 'foo' );
		} );

		it( 'should remove an anchor attribute ID when field is cleared', () => {
			const attributes = { anchor: '' };
			const extraProps = getSaveContentExtraProps(
				{},
				{
					...blockSettings,
					supports: {
						anchor: true,
					},
				},
				attributes
			);

			expect( extraProps.id ).toBe( null );
		} );
	} );
} );
