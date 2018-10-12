/**
 * External dependencies
 */
import { attr } from 'hpq';
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	getBlockAttribute,
	getBlockAttributes,
	asType,
	createBlockWithFallback,
	getMigratedBlock,
	default as parsePegjs,
	parseWithAttributeSchema,
	toBooleanAttributeMatcher,
	isOfType,
	isOfTypes,
} from '../parser';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
	setFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
} from '../registration';
import { createBlock } from '../factory';
import serialize from '../serializer';

describe( 'block parser', () => {
	const defaultBlockSettings = {
		attributes: {
			fruit: {
				type: 'string',
			},
		},
		save: ( { attributes } ) => attributes.fruit || null,
		category: 'common',
		title: 'block title',
	};

	const unknownBlockSettings = {
		category: 'common',
		title: 'unknown block',
		attributes: {
			content: {
				type: 'string',
				source: 'html',
			},
		},
		save: ( { attributes } ) => attributes.content || null,
	};

	beforeAll( () => {
		// Initialize the block store.
		require( '../../store' );
	} );

	afterEach( () => {
		setFreeformContentHandlerName( undefined );
		setUnregisteredTypeHandlerName( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

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

	describe( 'asType()', () => {
		it( 'gracefully handles undefined type', () => {
			expect( asType( 5 ) ).toBe( 5 );
		} );

		it( 'gracefully handles unhandled type', () => {
			expect( asType( 5, '__UNHANDLED__' ) ).toBe( 5 );
		} );

		it( 'returns expected coerced values', () => {
			const arr = [];
			const obj = {};

			expect( asType( '5', 'string' ) ).toBe( '5' );
			expect( asType( 5, 'string' ) ).toBe( '5' );

			expect( asType( 5, 'integer' ) ).toBe( 5 );
			expect( asType( '5', 'integer' ) ).toBe( 5 );

			expect( asType( 5, 'number' ) ).toBe( 5 );
			expect( asType( '5', 'number' ) ).toBe( 5 );

			expect( asType( true, 'boolean' ) ).toBe( true );
			expect( asType( false, 'boolean' ) ).toBe( false );
			expect( asType( '5', 'boolean' ) ).toBe( true );
			expect( asType( 0, 'boolean' ) ).toBe( false );

			expect( asType( null, 'null' ) ).toBe( null );
			expect( asType( 0, 'null' ) ).toBe( null );

			expect( asType( arr, 'array' ) ).toBe( arr );
			expect( asType( new Set( [ 1, 2, 3 ] ), 'array' ) ).toEqual( [ 1, 2, 3 ] );

			expect( asType( obj, 'object' ) ).toBe( obj );
			expect( asType( {}, 'object' ) ).toEqual( {} );
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

	describe( 'parseWithAttributeSchema', () => {
		it( 'should return the matcher’s attribute value', () => {
			const value = parseWithAttributeSchema(
				'<div>chicken</div>',
				{
					type: 'string',
					source: 'text',
					selector: 'div',
				},
			);
			expect( value ).toBe( 'chicken' );
		} );

		it( 'should return the matcher’s string attribute value', () => {
			const value = parseWithAttributeSchema(
				'<audio src="#" loop>',
				{
					type: 'string',
					source: 'attribute',
					selector: 'audio',
					attribute: 'src',
				},
			);
			expect( value ).toBe( '#' );
		} );

		it( 'should return the matcher’s true boolean attribute value', () => {
			const value = parseWithAttributeSchema(
				'<audio src="#" loop>',
				{
					type: 'boolean',
					source: 'attribute',
					selector: 'audio',
					attribute: 'loop',
				},
			);
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
				},
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
				},
			);
			expect( value ).toBe( false );
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

		it( 'should return original content for html source with no selector', () => {
			const value = getBlockAttribute(
				'content',
				{
					type: 'string',
					source: 'html',
				},
				'<path />',
				{}
			);

			expect( value ).toBe( '<path />' );
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

			expect( getBlockAttributes( blockType, innerHTML, attrs ) ).toEqual( {
				content: 'Ribs',
				align: null,
				topic: 'none',
				undefAmbiguousStringWithDefault: 'ok',
			} );
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

	describe( 'getMigratedBlock', () => {
		it( 'should return the original block if it has no deprecated versions', () => {
			const block = deepFreeze( {
				name: 'core/test-block',
				attributes: {},
				originalContent: '<span class="wp-block-test-block">Bananas</span>',
				isValid: false,
			} );
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const migratedBlock = getMigratedBlock( block );

			expect( migratedBlock ).toBe( block );
		} );

		it( 'should return the original block if no valid deprecated version found', () => {
			const block = deepFreeze( {
				name: 'core/test-block',
				attributes: {},
				originalContent: '<span class="wp-block-test-block">Bananas</span>',
				isValid: false,
			} );
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				deprecated: [
					{
						save() {
							return 'nothing';
						},
					},
				],
			} );

			const migratedBlock = getMigratedBlock( block );

			expect( migratedBlock ).toBe( block );
			expect( console ).toHaveErrored();
			expect( console ).toHaveWarned();
		} );

		it( 'should return with attributes parsed by the deprecated version', () => {
			const block = deepFreeze( {
				name: 'core/test-block',
				attributes: {},
				originalContent: '<span>Bananas</span>',
				isValid: false,
			} );
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				save: ( props ) => <div>{ props.attributes.fruit }</div>,
				deprecated: [
					{
						attributes: {
							fruit: {
								type: 'string',
								source: 'text',
								selector: 'span',
							},
						},
						save: ( props ) => <span>{ props.attributes.fruit }</span>,
					},
				],
			} );

			const migratedBlock = getMigratedBlock( block );

			expect( migratedBlock.attributes ).toEqual( { fruit: 'Bananas' } );
		} );

		it( 'should be able to migrate attributes and innerBlocks', () => {
			const block = deepFreeze( {
				name: 'core/test-block',
				attributes: {},
				originalContent: '<span>Bananas</span>',
				isValid: false,
			} );
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				save: ( props ) => <div>{ props.attributes.fruit }</div>,
				deprecated: [
					{
						attributes: {
							fruit: {
								type: 'string',
								source: 'text',
								selector: 'span',
							},
						},
						save: ( props ) => <span>{ props.attributes.fruit }</span>,
						migrate: ( attributes ) => {
							return [
								{ newFruit: attributes.fruit },
								[ {
									name: 'core/test-block',
									attributes: { aaa: 'bbb' },
								} ],
							];
						},
					},
				],
			} );

			const migratedBlock = getMigratedBlock( block );

			expect( migratedBlock.attributes ).toEqual( { newFruit: 'Bananas' } );
			expect( migratedBlock.innerBlocks ).toHaveLength( 1 );
			expect( migratedBlock.innerBlocks[ 0 ].name ).toEqual( 'core/test-block' );
			expect( migratedBlock.innerBlocks[ 0 ].attributes ).toEqual( { aaa: 'bbb' } );
		} );

		it( 'should ignore valid uneligible blocks', () => {
			const block = deepFreeze( {
				name: 'core/test-block',
				attributes: {
					fruit: 'Bananas',
				},
				originalContent: 'Bananas',
				isValid: true,
			} );
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				deprecated: [
					{
						attributes: defaultBlockSettings.attributes,
						save: defaultBlockSettings.save,
						migrate( attributes ) {
							return {
								fruit: attributes.fruit + '!',
							};
						},
					},
				],
			} );

			const migratedBlock = getMigratedBlock( block );

			expect( migratedBlock.attributes ).toEqual( { fruit: 'Bananas' } );
		} );

		it( 'should allow opt-in eligibility of valid block', () => {
			const block = deepFreeze( {
				name: 'core/test-block',
				attributes: {
					fruit: 'Bananas',
				},
				originalContent: 'Bananas',
				isValid: true,
			} );
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				deprecated: [
					{
						attributes: defaultBlockSettings.attributes,
						save: defaultBlockSettings.save,
						isEligible: () => true,
						migrate( attributes ) {
							return {
								fruit: attributes.fruit + '!',
							};
						},
					},
				],
			} );

			const migratedBlock = getMigratedBlock( block );

			expect( migratedBlock.attributes ).toEqual( { fruit: 'Bananas!' } );
		} );
	} );

	describe( 'createBlockWithFallback', () => {
		it( 'should create the requested block if it exists', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const block = createBlockWithFallback( {
				blockName: 'core/test-block',
				innerHTML: 'Bananas',
				attrs: { fruit: 'Bananas' },
			} );
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( { fruit: 'Bananas' } );
		} );

		it( 'should create the requested block with no attributes if it exists', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const block = createBlockWithFallback( {
				blockName: 'core/test-block',
				innerHTML: '',
			} );
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( {} );
		} );

		it( 'should fall back to the unregistered type handler for unregistered blocks if present', () => {
			registerBlockType( 'core/unregistered-block', unknownBlockSettings );
			setUnregisteredTypeHandlerName( 'core/unregistered-block' );

			const block = createBlockWithFallback( {
				blockName: 'core/test-block',
				innerHTML: 'Bananas',
				attrs: { fruit: 'Bananas' },
			} );
			expect( block.name ).toBe( 'core/unregistered-block' );
			expect( block.attributes.content ).toContain( 'wp:test-block' );
		} );

		it( 'should fall back to the freeform content handler if block type not specified', () => {
			registerBlockType( 'core/freeform-block', unknownBlockSettings );
			setFreeformContentHandlerName( 'core/freeform-block' );

			const block = createBlockWithFallback( {
				innerHTML: 'content',
			} );
			expect( block.name ).toEqual( 'core/freeform-block' );
			expect( block.attributes ).toEqual( { content: '<p>content</p>' } );
		} );

		it( 'should not create a block if no unknown type handler', () => {
			const block = createBlockWithFallback( {
				blockName: 'core/test-block',
				innerHTML: '',
			} );
			expect( block ).toBeUndefined();
		} );

		it( 'should fallback to an older version of the block if the current one is invalid', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					fruit: {
						type: 'string',
						source: 'text',
						selector: 'div',
					},
				},
				save: ( { attributes } ) => <div>{ attributes.fruit }</div>,
				deprecated: [
					{
						attributes: {
							fruit: {
								type: 'string',
								source: 'text',
								selector: 'span',
							},
						},
						save: ( { attributes } ) => <span>{ attributes.fruit }</span>,
						migrate: ( attributes ) => ( { fruit: 'Big ' + attributes.fruit } ),
					},
				],
			} );

			const block = createBlockWithFallback( {
				blockName: 'core/test-block',
				innerHTML: '<span>Bananas</span>',
				attrs: { fruit: 'Bananas' },
			} );
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( { fruit: 'Big Bananas' } );
			expect( block.isValid ).toBe( true );
			expect( console ).toHaveErrored();
			expect( console ).toHaveWarned();
		} );
	} );

	describe( 'parse() of @wordpress/block-serialization-spec-parser', () => {
		// run the test cases using the PegJS defined parser
		testCases( parsePegjs );
	} );

	// encapsulate the test cases so we can run them multiple time but with a different parse() function
	function testCases( parse ) {
		it( 'should parse the post content, including block attributes', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					content: {
						type: 'string',
						source: 'text',
					},
					smoked: { type: 'string' },
					url: { type: 'string' },
					chicken: { type: 'string' },
				},
				save: ( { attributes } ) => attributes.content,
				category: 'common',
				title: 'test block',
			} );

			const parsed = parse(
				`<!-- wp:core/test-block {"smoked":"yes","url":"http://google.com","chicken":"ribs & 'wings'"} -->` +
				'Brisket' +
				'<!-- /wp:core/test-block -->'
			);

			expect( parsed ).toHaveLength( 1 );
			expect( parsed[ 0 ].name ).toBe( 'core/test-block' );
			expect( parsed[ 0 ].attributes ).toEqual( {
				content: 'Brisket',
				smoked: 'yes',
				url: 'http://google.com',
				chicken: "ribs & 'wings'",
			} );
			expect( typeof parsed[ 0 ].clientId ).toBe( 'string' );
		} );

		it( 'should parse empty post content', () => {
			const parsed = parse( '' );

			expect( parsed ).toEqual( [] );
		} );

		it( 'should parse the post content, ignoring unknown blocks', () => {
			registerBlockType( 'core/test-block', {
				attributes: {
					content: {
						type: 'string',
						source: 'text',
					},
				},
				save: ( { attributes } ) => attributes.content,
				category: 'common',
				title: 'test block',
			} );

			const parsed = parse(
				'<!-- wp:core/test-block -->\nRibs\n<!-- /wp:core/test-block -->' +
				'<p>Broccoli</p>' +
				'<!-- wp:core/unknown-block -->Ribs<!-- /wp:core/unknown-block -->'
			);

			expect( parsed ).toHaveLength( 1 );
			expect( parsed[ 0 ].name ).toBe( 'core/test-block' );
			expect( parsed[ 0 ].attributes ).toEqual( {
				content: 'Ribs',
			} );
			expect( typeof parsed[ 0 ].clientId ).toBe( 'string' );
		} );

		it( 'should add the core namespace to un-namespaced blocks', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const parsed = parse(
				'<!-- wp:test-block {"fruit":"Bananas"} -->\nBananas\n<!-- /wp:test-block -->'
			);

			expect( parsed ).toHaveLength( 1 );
			expect( parsed[ 0 ].name ).toBe( 'core/test-block' );
		} );

		it( 'should ignore blocks with a bad namespace', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			setFreeformContentHandlerName( 'core/unknown-block' );
			setUnregisteredTypeHandlerName( 'core/unknown-block' );

			const parsed = parse(
				'<!-- wp:test-block {"fruit":"Bananas"} -->\nBananas\n<!-- /wp:test-block -->' +
				'<p>Broccoli</p>' +
				'<!-- wp:core/unknown/block -->Ribs<!-- /wp:core/unknown/block -->'
			);
			expect( parsed ).toHaveLength( 1 );
			expect( parsed[ 0 ].name ).toBe( 'core/test-block' );
		} );

		it( 'should parse the post content, using unknown block handler', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			registerBlockType( 'core/unknown-block', unknownBlockSettings );

			setFreeformContentHandlerName( 'core/unknown-block' );

			const parsed = parse(
				'<!-- wp:test-block {"fruit":"Bananas"} -->\nBananas\n<!-- /wp:test-block -->' +
				'<p>Broccoli</p>' +
				'<!-- wp:core/unknown-block -->Ribs<!-- /wp:core/unknown-block -->'
			);

			expect( parsed ).toHaveLength( 3 );
			expect( parsed.map( ( { name } ) => name ) ).toEqual( [
				'core/test-block',
				'core/unknown-block',
				'core/unknown-block',
			] );
		} );

		it( 'should parse the post content, including raw HTML at each end', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			registerBlockType( 'core/unknown-block', unknownBlockSettings );

			setFreeformContentHandlerName( 'core/unknown-block' );

			const parsed = parse(
				'<p>Cauliflower</p>' +
				'<!-- wp:test-block {"fruit":"Bananas"} -->\nBananas\n<!-- /wp:test-block -->' +
				'\n<p>Broccoli</p>\n' +
				'<!-- wp:test-block {"fruit":"Bananas"} -->\nBananas\n<!-- /wp:test-block -->' +
				'<p>Romanesco</p>'
			);

			expect( parsed ).toHaveLength( 5 );
			expect( parsed.map( ( { name } ) => name ) ).toEqual( [
				'core/unknown-block',
				'core/test-block',
				'core/unknown-block',
				'core/test-block',
				'core/unknown-block',
			] );
			expect( parsed[ 0 ].attributes.content ).toEqual( '<p>Cauliflower</p>' );
			expect( parsed[ 2 ].attributes.content ).toEqual( '<p>Broccoli</p>' );
			expect( parsed[ 4 ].attributes.content ).toEqual( '<p>Romanesco</p>' );
		} );

		it( 'should parse blocks with empty content', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const parsed = parse(
				'<!-- wp:core/test-block --><!-- /wp:core/test-block -->'
			);

			expect( parsed ).toHaveLength( 1 );
			expect( parsed.map( ( { name } ) => name ) ).toEqual( [
				'core/test-block',
			] );
		} );

		it( 'should parse void blocks', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			registerBlockType( 'core/void-block', defaultBlockSettings );
			const parsed = parse(
				'<!-- wp:core/test-block --><!-- /wp:core/test-block -->' +
				'<!-- wp:core/void-block /-->'
			);

			expect( parsed ).toHaveLength( 2 );
			expect( parsed.map( ( { name } ) => name ) ).toEqual( [
				'core/test-block', 'core/void-block',
			] );
		} );

		it( 'should parse with unicode escaped returned to original representation', () => {
			registerBlockType( 'core/code', {
				category: 'common',
				title: 'Code Block',
				attributes: {
					content: {
						type: 'string',
					},
				},
				save: ( { attributes } ) => attributes.content,
			} );

			const content = '$foo = "My \"escaped\" text.";';
			const block = createBlock( 'core/code', { content } );
			const serialized = serialize( block );
			const parsed = parse( serialized );
			expect( parsed[ 0 ].attributes.content ).toBe( content );
		} );
	}
} );
