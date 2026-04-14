/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getBlockContentSchemaFromTransforms, isPlain } from '../utils';

describe( 'isPlain', () => {
	it( 'should return true for plain text', () => {
		expect( isPlain( 'test' ) ).toBe( true );
	} );

	it( 'should return true for only line breaks', () => {
		expect( isPlain( 'test<br>test' ) ).toBe( true );
		expect( isPlain( 'test<br/>test' ) ).toBe( true );
		expect( isPlain( 'test<br />test' ) ).toBe( true );
		expect( isPlain( 'test<br data-test>test' ) ).toBe( true );
	} );

	it( 'should return false for formatted text', () => {
		expect( isPlain( '<strong>test</strong>' ) ).toBe( false );
		expect( isPlain( '<strong>test<br></strong>' ) ).toBe( false );
		expect( isPlain( 'test<br-custom>test' ) ).toBe( false );
	} );

	it( 'should return true for single non-semantic wrapper elements with only text', () => {
		expect( isPlain( '<span>test</span>' ) ).toBe( true );
	} );

	it( 'should return true for single wrapper with styled content but no semantic tags', () => {
		expect( isPlain( '<span style="color: red;">test</span>' ) ).toBe(
			true
		);
	} );

	it( 'should return true for single wrapper with line breaks', () => {
		expect( isPlain( '<span>test<br>test</span>' ) ).toBe( true );
	} );

	it( 'should return false for wrapper with semantic child elements', () => {
		expect( isPlain( '<div><strong>test</strong></div>' ) ).toBe( false );
		expect( isPlain( '<span><em>test</em></span>' ) ).toBe( false );
		expect( isPlain( '<p>Some <a href="#">link</a></p>' ) ).toBe( false );
	} );

	it( 'should return false for multiple wrapper elements', () => {
		expect( isPlain( '<span>test</span><span>test</span>' ) ).toBe( false );
	} );

	it( 'should return false for semantic wrapper elements', () => {
		expect( isPlain( '<h1>test</h1>' ) ).toBe( false );
		expect( isPlain( '<ul><li>test</li></ul>' ) ).toBe( false );
		expect( isPlain( '<article>test</article>' ) ).toBe( false );
	} );
} );

describe( 'getBlockContentSchema', () => {
	beforeAll( () => {
		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			title: 'Paragraph',
			supports: {
				anchor: true,
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/paragraph' );
	} );

	const myContentSchema = {
		strong: {},
		em: {},
	};

	it( 'should handle a single raw transform', () => {
		const transforms = deepFreeze( [
			{
				blockName: 'core/paragraph',
				type: 'raw',
				selector: 'p',
				schema: {
					p: {
						children: myContentSchema,
					},
				},
			},
		] );
		const output = {
			p: {
				children: myContentSchema,
				attributes: [ 'id' ],
				isMatch: undefined,
			},
		};
		expect( getBlockContentSchemaFromTransforms( transforms ) ).toEqual(
			output
		);
	} );

	it( 'should handle multiple raw transforms', () => {
		const preformattedIsMatch = ( input ) => {
			return input === 4;
		};
		const transforms = deepFreeze( [
			{
				blockName: 'core/paragraph',
				type: 'raw',
				schema: {
					p: {
						children: myContentSchema,
					},
				},
			},
			{
				blockName: 'core/preformatted',
				type: 'raw',
				isMatch: preformattedIsMatch,
				schema: {
					pre: {
						children: myContentSchema,
					},
				},
			},
		] );
		const output = {
			p: {
				children: myContentSchema,
				attributes: [ 'id' ],
				isMatch: undefined,
			},
			pre: {
				children: myContentSchema,
				attributes: [],
				isMatch: preformattedIsMatch,
			},
		};
		expect( getBlockContentSchemaFromTransforms( transforms ) ).toEqual(
			output
		);
	} );

	it( 'should correctly merge the children', () => {
		const transforms = deepFreeze( [
			{
				blockName: 'my/preformatted',
				type: 'raw',
				schema: {
					pre: {
						children: {
							sub: {},
							sup: {},
							strong: {},
						},
					},
				},
			},
			{
				blockName: 'core/preformatted',
				type: 'raw',
				schema: {
					pre: {
						children: myContentSchema,
					},
				},
			},
		] );
		const output = {
			pre: {
				children: {
					strong: {},
					em: {},
					sub: {},
					sup: {},
				},
			},
		};
		expect( getBlockContentSchemaFromTransforms( transforms ) ).toEqual(
			output
		);
	} );

	it( 'should correctly merge the attributes', () => {
		const transforms = deepFreeze( [
			{
				blockName: 'my/preformatted',
				type: 'raw',
				schema: {
					pre: {
						attributes: [ 'data-chicken' ],
						children: myContentSchema,
					},
				},
			},
			{
				blockName: 'core/preformatted',
				type: 'raw',
				schema: {
					pre: {
						attributes: [ 'data-ribs' ],
						children: myContentSchema,
					},
				},
			},
		] );
		const output = {
			pre: {
				children: myContentSchema,
				attributes: [ 'data-chicken', 'data-ribs' ],
			},
		};
		expect( getBlockContentSchemaFromTransforms( transforms ) ).toEqual(
			output
		);
	} );
} );
