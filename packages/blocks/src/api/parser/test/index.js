/**
 * Internal dependencies
 */
import { parseRawBlock, default as parse } from '../';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
	setFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
} from '../../registration';
import { createBlock } from '../../factory';
import serialize from '../../serializer';

describe( 'block parser', () => {
	const defaultBlockSettings = {
		attributes: {
			fruit: {
				type: 'string',
			},
		},
		save: ( { attributes } ) => attributes.fruit || null,
		category: 'text',
		title: 'block title',
	};

	const unknownBlockSettings = {
		category: 'text',
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
		require( '../../../store' );
	} );

	afterEach( () => {
		setFreeformContentHandlerName( undefined );
		setUnregisteredTypeHandlerName( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'parseRawBlock', () => {
		it( 'should create the requested block if it exists', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const block = parseRawBlock( {
				blockName: 'core/test-block',
				innerHTML: 'Bananas',
				attrs: { fruit: 'Bananas' },
			} );
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( { fruit: 'Bananas' } );
		} );

		it( 'should create the requested block with no attributes if it exists', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const block = parseRawBlock( {
				blockName: 'core/test-block',
				innerHTML: '',
			} );
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( {} );
		} );

		it( 'should fall back to the unregistered type handler for unregistered blocks if present', () => {
			registerBlockType(
				'core/unregistered-block',
				unknownBlockSettings
			);
			setUnregisteredTypeHandlerName( 'core/unregistered-block' );

			const block = parseRawBlock( {
				blockName: 'core/test-block',
				innerHTML: 'Bananas',
				attrs: { fruit: 'Bananas' },
			} );
			expect( block.name ).toBe( 'core/unregistered-block' );
			expect( block.attributes.content ).toContain( 'wp:test-block' );
		} );

		it( 'should fall back to the freeform content handler if block type not specified', () => {
			registerBlockType( 'core/freeform', unknownBlockSettings );
			setFreeformContentHandlerName( 'core/freeform' );

			const block = parseRawBlock( {
				innerHTML: 'content',
			} );
			expect( block.name ).toEqual( 'core/freeform' );
			expect( block.attributes ).toEqual( { content: '<p>content</p>' } );
		} );

		it( 'skips adding paragraph tags if freeform block is set to core/html', () => {
			registerBlockType( 'core/html', unknownBlockSettings );
			setFreeformContentHandlerName( 'core/html' );

			const block = parseRawBlock( {
				innerHTML: 'content',
			} );
			expect( block.name ).toEqual( 'core/html' );
			expect( block.attributes ).toEqual( { content: 'content' } );
		} );

		it( 'skips adding paragraph tags if __unstableSkipAutop is passed as an option', () => {
			registerBlockType( 'core/freeform', unknownBlockSettings );
			setFreeformContentHandlerName( 'core/freeform' );

			const block = parseRawBlock(
				{
					innerHTML: 'content',
				},
				{
					__unstableSkipAutop: true,
				}
			);
			expect( block.name ).toEqual( 'core/freeform' );
			expect( block.attributes ).toEqual( { content: 'content' } );
		} );

		it( 'should not create a block if no unknown type handler', () => {
			const block = parseRawBlock( {
				blockName: 'core/test-block',
				innerHTML: '',
			} );
			expect( block ).toBeUndefined();
		} );
		describe( 'fall back to an older version of the block if the current one is invalid', () => {
			beforeEach( () => {
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
							save: ( { attributes } ) => (
								<span>{ attributes.fruit }</span>
							),
							migrate: ( attributes ) => ( {
								fruit: 'Big ' + attributes.fruit,
							} ),
						},
					],
				} );
			} );
			it( 'handle deprecation and log', () => {
				const block = parseRawBlock( {
					blockName: 'core/test-block',
					innerHTML: '<span>Bananas</span>',
					attrs: { fruit: 'Bananas' },
				} );
				expect( block.name ).toEqual( 'core/test-block' );
				expect( block.attributes ).toEqual( { fruit: 'Big Bananas' } );
				expect( block.isValid ).toBe( true );
				expect( console ).toHaveInformed();
			} );
			it( 'handle deprecation but not log', () => {
				const block = parseRawBlock(
					{
						blockName: 'core/test-block',
						innerHTML: '<span>Bananas</span>',
						attrs: { fruit: 'Bananas' },
					},
					{ __unstableSkipMigrationLogs: true }
				);
				expect( block.name ).toEqual( 'core/test-block' );
				expect( block.attributes ).toEqual( { fruit: 'Big Bananas' } );
				expect( block.isValid ).toBe( true );
				expect( console ).not.toHaveInformed();
			} );
		} );
	} );

	describe( 'parse', () => {
		// Run the test cases using the PegJS defined parser.
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
				category: 'text',
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
				category: 'text',
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
			expect( parsed[ 0 ].attributes.content ).toEqual(
				'<p>Cauliflower</p>'
			);
			expect( parsed[ 2 ].attributes.content ).toEqual(
				'<p>Broccoli</p>'
			);
			expect( parsed[ 4 ].attributes.content ).toEqual(
				'<p>Romanesco</p>'
			);
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
				'core/test-block',
				'core/void-block',
			] );
		} );

		it( 'should parse with unicode escaped returned to original representation', () => {
			registerBlockType( 'core/code', {
				category: 'text',
				title: 'Code Block',
				attributes: {
					content: {
						type: 'string',
					},
				},
				save: ( { attributes } ) => attributes.content,
			} );

			const content = '$foo = "My "escaped" text.";';
			const block = createBlock( 'core/code', { content } );
			const serialized = serialize( block );
			const parsed = parse( serialized );
			expect( parsed[ 0 ].attributes.content ).toBe( content );
		} );
	} );
} );
