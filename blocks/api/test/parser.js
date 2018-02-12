/**
 * Internal dependencies
 */
import {
	getBlockAttribute,
	getBlockAttributes,
	asType,
	createBlockWithFallback,
	getAttributesFromDeprecatedVersion,
	default as parse,
} from '../parser';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
	setUnknownTypeHandlerName,
} from '../registration';

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
		// Load all hooks that modify blocks
		require( 'blocks/hooks' );
	} );

	afterEach( () => {
		setUnknownTypeHandlerName( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
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

		it( 'should return the matcher\'s attribute value', () => {
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
		it( 'should merge attributes with the parsed and default attributes', () => {
			const blockType = {
				attributes: {
					content: {
						type: 'string',
						source: 'text',
						selector: 'div',
					},
					number: {
						type: 'number',
						source: 'attribute',
						attribute: 'data-number',
						selector: 'div',
					},
					align: {
						type: 'string',
					},
					topic: {
						type: 'string',
						default: 'none',
					},
				},
			};

			const innerHTML = '<div data-number="10">Ribs</div>';
			const attrs = { align: 'left', invalid: true };

			expect( getBlockAttributes( blockType, innerHTML, attrs ) ).toEqual( {
				content: 'Ribs',
				number: 10,
				align: 'left',
				topic: 'none',
			} );
		} );
	} );

	describe( 'getAttributesFromDeprecatedVersion', () => {
		it( 'should return undefined if the block has no deprecated versions', () => {
			const attributes = getAttributesFromDeprecatedVersion(
				defaultBlockSettings,
				'<span class="wp-block-test-block">Bananas</span>',
				{},
			);
			expect( attributes ).toBeUndefined();
		} );

		it( 'should return undefined if no valid deprecated version found', () => {
			const attributes = getAttributesFromDeprecatedVersion(
				{
					name: 'core/test-block',
					...defaultBlockSettings,
					deprecated: [
						{
							save() {
								return 'nothing';
							},
						},
					],
				},
				'<span class="wp-block-test-block">Bananas</span>',
				{},
			);
			expect( attributes ).toBeUndefined();
			expect( console ).toHaveErrored();
			expect( console ).toHaveWarned();
		} );

		it( 'should return the attributes parsed by the deprecated version', () => {
			const attributes = getAttributesFromDeprecatedVersion(
				{
					name: 'core/test-block',
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
				},
				'<span class="wp-block-test-block">Bananas</span>',
				{},
			);
			expect( attributes ).toEqual( { fruit: 'Bananas' } );
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

		it( 'should fall back to the unknown type handler for unknown blocks if present', () => {
			registerBlockType( 'core/unknown-block', unknownBlockSettings );
			setUnknownTypeHandlerName( 'core/unknown-block' );

			const block = createBlockWithFallback( {
				blockName: 'core/test-block',
				innerHTML: 'Bananas',
				attrs: { fruit: 'Bananas' },
			} );
			expect( block.name ).toBe( 'core/unknown-block' );
			expect( block.attributes.content ).toContain( 'wp:test-block' );
		} );

		it( 'should fall back to the unknown type handler if block type not specified', () => {
			registerBlockType( 'core/unknown-block', unknownBlockSettings );
			setUnknownTypeHandlerName( 'core/unknown-block' );

			const block = createBlockWithFallback( {
				innerHTML: 'content',
			} );
			expect( block.name ).toEqual( 'core/unknown-block' );
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
				innerHTML: '<span class="wp-block-test-block">Bananas</span>',
				attrs: { fruit: 'Bananas' },
			} );
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( { fruit: 'Big Bananas' } );
			expect( block.isValid ).toBe( true );
			expect( console ).toHaveErrored();
			expect( console ).toHaveWarned();
		} );
	} );

	describe( 'parse()', () => {
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
				'<!-- wp:core/test-block {"smoked":"yes","url":"http://google.com","chicken":"ribs & \'wings\'"} -->' +
				'Brisket' +
				'<!-- /wp:core/test-block -->'
			);

			expect( parsed ).toHaveLength( 1 );
			expect( parsed[ 0 ].name ).toBe( 'core/test-block' );
			expect( parsed[ 0 ].attributes ).toEqual( {
				content: 'Brisket',
				smoked: 'yes',
				url: 'http://google.com',
				chicken: 'ribs & \'wings\'',
			} );
			expect( typeof parsed[ 0 ].uid ).toBe( 'string' );
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
			expect( typeof parsed[ 0 ].uid ).toBe( 'string' );
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

			setUnknownTypeHandlerName( 'core/unknown-block' );

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

			setUnknownTypeHandlerName( 'core/unknown-block' );

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

			setUnknownTypeHandlerName( 'core/unknown-block' );

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
	} );
} );
