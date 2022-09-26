/**
 * External dependencies
 */
import { attr } from 'hpq';

/**
 * Internal dependencies
 */
import {
	getBlockAttribute,
	getBlockAttributes,
	parseWithAttributeSchema,
	toBooleanAttributeMatcher,
	isOfType,
	isOfTypes,
	isValidByType,
	isValidByEnum,
} from '../get-block-attributes';
import { registerBlockType } from '../../registration';

describe( 'attributes parsing', () => {
	describe( 'toBooleanAttributeMatcher()', () => {
		const originalMatcher = attr( 'disabled' );
		const enhancedMatcher = toBooleanAttributeMatcher( originalMatcher );

		it( 'should return a matcher returning false on unset attribute', () => {
			const node = document.createElement( 'input' );

			expect( originalMatcher( node ) ).toBe( undefined );
			expect( enhancedMatcher( node ) ).toBe( false );
		} );

		it( 'should return a matcher returning true on implicit empty string attribute value', () => {
			const node = document.createElement( 'input' );
			node.disabled = true;

			expect( originalMatcher( node ) ).toBe( '' );
			expect( enhancedMatcher( node ) ).toBe( true );
		} );

		it( 'should return a matcher returning true on explicit empty string attribute value', () => {
			const node = document.createElement( 'input' );
			node.setAttribute( 'disabled', '' );

			expect( originalMatcher( node ) ).toBe( '' );
			expect( enhancedMatcher( node ) ).toBe( true );
		} );

		it( 'should return a matcher returning true on explicit string attribute value', () => {
			const node = document.createElement( 'input' );
			node.setAttribute( 'disabled', 'disabled' );

			expect( originalMatcher( node ) ).toBe( 'disabled' );
			expect( enhancedMatcher( node ) ).toBe( true );
		} );
	} );

	describe( 'isOfType()', () => {
		it( 'gracefully handles unhandled type', () => {
			expect( isOfType( 5, '__UNHANDLED__' ) ).toBe( true );
		} );

		it( 'returns expected result of type', () => {
			expect( isOfType( '5', 'string' ) ).toBe( true );
			expect( isOfType( 5, 'string' ) ).toBe( false );

			expect( isOfType( 5, 'integer' ) ).toBe( true );
			expect( isOfType( '5', 'integer' ) ).toBe( false );

			expect( isOfType( 5, 'number' ) ).toBe( true );
			expect( isOfType( '5', 'number' ) ).toBe( false );

			expect( isOfType( true, 'boolean' ) ).toBe( true );
			expect( isOfType( false, 'boolean' ) ).toBe( true );
			expect( isOfType( '5', 'boolean' ) ).toBe( false );
			expect( isOfType( 0, 'boolean' ) ).toBe( false );

			expect( isOfType( null, 'null' ) ).toBe( true );
			expect( isOfType( 0, 'null' ) ).toBe( false );

			expect( isOfType( [], 'array' ) ).toBe( true );

			expect( isOfType( {}, 'object' ) ).toBe( true );
			expect( isOfType( null, 'object' ) ).toBe( false );
		} );
	} );

	describe( 'isOfTypes', () => {
		it( 'returns false if value is not one of types', () => {
			expect( isOfTypes( null, [ 'string' ] ) ).toBe( false );
		} );

		it( 'returns true if value is one of types', () => {
			expect( isOfTypes( null, [ 'string', 'null' ] ) ).toBe( true );
		} );
	} );

	describe( 'isValidByType', () => {
		it( 'returns true if type undefined', () => {
			expect( isValidByType( null ) ).toBe( true );
		} );

		it( 'returns false if value is not one of types array', () => {
			expect( isValidByType( null, [ 'string' ] ) ).toBe( false );
		} );

		it( 'returns true if value is one of types array', () => {
			expect( isValidByType( null, [ 'string', 'null' ] ) ).toBe( true );
		} );

		it( 'returns false if value is not of type string', () => {
			expect( isValidByType( null, 'string' ) ).toBe( false );
		} );

		it( 'returns true if value is type string', () => {
			expect( isValidByType( null, 'null' ) ).toBe( true );
		} );
	} );

	describe( 'isValidByEnum', () => {
		it( 'returns true if enum set undefined', () => {
			expect( isValidByEnum( 2 ) ).toBe( true );
		} );

		it( 'returns false if value is not of enum set', () => {
			expect( isValidByEnum( 2, [ 1, 3 ] ) ).toBe( false );
		} );

		it( 'returns true if value is of enum set', () => {
			expect( isValidByEnum( 2, [ 1, 2, 3 ] ) ).toBe( true );
		} );
	} );

	describe( 'parseWithAttributeSchema', () => {
		it( 'should return the matcher’s attribute value', () => {
			const value = parseWithAttributeSchema( '<div>chicken</div>', {
				type: 'string',
				source: 'text',
				selector: 'div',
			} );
			expect( value ).toBe( 'chicken' );
		} );

		it( 'should return the matcher’s string attribute value', () => {
			const value = parseWithAttributeSchema( '<audio src="#" loop>', {
				type: 'string',
				source: 'attribute',
				selector: 'audio',
				attribute: 'src',
			} );
			expect( value ).toBe( '#' );
		} );

		it( 'should return the matcher’s true boolean attribute value', () => {
			const value = parseWithAttributeSchema( '<audio src="#" loop>', {
				type: 'boolean',
				source: 'attribute',
				selector: 'audio',
				attribute: 'loop',
			} );
			expect( value ).toBe( true );
		} );

		it( 'should return the matcher’s true boolean attribute value on explicit attribute value', () => {
			const value = parseWithAttributeSchema(
				'<audio src="#" loop="loop">',
				{
					type: 'boolean',
					source: 'attribute',
					selector: 'audio',
					attribute: 'loop',
				}
			);
			expect( value ).toBe( true );
		} );

		it( 'should return the matcher’s false boolean attribute value', () => {
			const value = parseWithAttributeSchema(
				'<audio src="#" autoplay>',
				{
					type: 'boolean',
					source: 'attribute',
					selector: 'audio',
					attribute: 'loop',
				}
			);
			expect( value ).toBe( false );
		} );

		describe( 'source: tag', () => {
			it( 'returns tag name of matching selector', () => {
				const value = parseWithAttributeSchema( '<div></div>', {
					source: 'tag',
					selector: ':nth-child(1)',
				} );

				expect( value ).toBe( 'div' );
			} );

			it( 'returns undefined when no element matches selector', () => {
				const value = parseWithAttributeSchema( '<div></div>', {
					source: 'tag',
					selector: ':nth-child(2)',
				} );

				expect( value ).toBe( undefined );
			} );
		} );
	} );

	describe( 'getBlockAttribute', () => {
		it( 'should return the comment attribute value', () => {
			const value = getBlockAttribute(
				'number',
				{
					type: 'number',
				},
				'',
				{ number: 10 }
			);

			expect( value ).toBe( 10 );
		} );

		it( 'should return the comment attribute value when using multiple types', () => {
			const value = getBlockAttribute(
				'templateLock',
				{
					type: [ 'string', 'boolean' ],
					enum: [ 'all', 'insert', false ],
				},
				'',
				{
					templateLock: false,
				}
			);

			expect( value ).toBe( false );
		} );

		it( 'should reject type-invalid value, with default', () => {
			const value = getBlockAttribute(
				'number',
				{
					type: 'string',
					default: 5,
				},
				'',
				{ number: 10 }
			);

			expect( value ).toBe( 5 );
		} );

		it( 'should reject type-invalid value, without default', () => {
			const value = getBlockAttribute(
				'number',
				{
					type: 'string',
				},
				'',
				{ number: 10 }
			);

			expect( value ).toBe( undefined );
		} );

		it( 'should reject enum-invalid value, with default', () => {
			const value = getBlockAttribute(
				'number',
				{
					type: 'number',
					enum: [ 4, 5, 6 ],
					default: 5,
				},
				'',
				{ number: 10 }
			);

			expect( value ).toBe( 5 );
		} );

		it( 'should reject enum-invalid value, without default', () => {
			const value = getBlockAttribute(
				'number',
				{
					type: 'number',
					enum: [ 4, 5, 6 ],
				},
				'',
				{ number: 10 }
			);

			expect( value ).toBe( undefined );
		} );

		it( "should return the matcher's attribute value", () => {
			const value = getBlockAttribute(
				'content',
				{
					type: 'string',
					source: 'text',
					selector: 'div',
				},
				'<div>chicken</div>',
				{}
			);
			expect( value ).toBe( 'chicken' );
		} );

		it( 'should return undefined for meta attributes', () => {
			const value = getBlockAttribute(
				'content',
				{
					type: 'string',
					source: 'meta',
					meta: 'content',
				},
				'<div>chicken</div>',
				{}
			);
			expect( value ).toBeUndefined();
		} );
	} );

	describe( 'getBlockAttributes()', () => {
		it( 'should reject the value with a wrong type', () => {
			const blockType = {
				attributes: {
					number: {
						type: 'number',
						source: 'attribute',
						attribute: 'data-number',
						selector: 'div',
					},
				},
			};

			const innerHTML = '<div data-number="10">Ribs</div>';

			expect( getBlockAttributes( blockType, innerHTML, {} ) ).toEqual( {
				number: undefined,
			} );
		} );

		it( 'should merge attributes with the parsed and default attributes', () => {
			const blockType = {
				attributes: {
					content: {
						source: 'text',
						selector: 'div',
					},
					align: {
						type: [ 'string', 'null' ],
					},
					topic: {
						type: 'string',
						default: 'none',
					},
					undefAmbiguousStringWithDefault: {
						type: 'string',
						source: 'attribute',
						selector: 'div',
						attribute: 'data-foo',
						default: 'ok',
					},
				},
			};

			const innerHTML = '<div data-number="10">Ribs</div>';
			const attrs = { align: null, invalid: true };

			expect( getBlockAttributes( blockType, innerHTML, attrs ) ).toEqual(
				{
					content: 'Ribs',
					align: null,
					topic: 'none',
					undefAmbiguousStringWithDefault: 'ok',
				}
			);
		} );

		it( 'should work when block type is passed as string', () => {
			registerBlockType( 'core/meal', {
				title: 'Meal',
				category: 'widgets',
				attributes: {
					content: {
						source: 'text',
						selector: 'div',
					},
				},
				save: () => {},
			} );

			const innerHTML = '<div data-number="10">Ribs</div>';

			expect( getBlockAttributes( 'core/meal', innerHTML ) ).toEqual( {
				content: 'Ribs',
			} );
		} );
	} );
} );
