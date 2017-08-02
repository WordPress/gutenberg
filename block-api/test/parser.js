/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { text, attr, html } from '../source';
import {
	isValidSource,
	getBlockAttributes,
	asType,
	getSourcedAttributes,
	createBlockWithFallback,
	default as parse,
} from '../parser';

describe( 'block parser', () => {
	const defaultBlockType = {
		name: 'core/test-block',
		attributes: {
			fruit: {
				type: 'string',
			},
		},
		save: ( { attributes } ) => attributes.fruit,
		category: 'common',
	};

	describe( 'isValidSource()', () => {
		it( 'returns false if falsey argument', () => {
			expect( isValidSource() ).toBe( false );
		} );

		it( 'returns true if valid source argument', () => {
			expect( isValidSource( text() ) ).toBe( true );
		} );

		it( 'returns false if invalid source argument', () => {
			expect( isValidSource( () => {} ) ).toBe( false );
		} );
	} );

	describe( 'getSourcedAttributes()', () => {
		it( 'should return matched attributes from valid sources', () => {
			const sources = {
				number: {
					type: 'number',
				},
				emphasis: {
					type: 'string',
					source: text( 'strong' ),
				},
			};

			const rawContent = '<span>Ribs <strong>& Chicken</strong></span>';

			expect( getSourcedAttributes( rawContent, sources ) ).toEqual( {
				emphasis: '& Chicken',
			} );
		} );

		it( 'should return an empty object if no sources defined', () => {
			const sources = {};
			const rawContent = '<span>Ribs <strong>& Chicken</strong></span>';

			expect( getSourcedAttributes( rawContent, sources ) ).toEqual( {} );
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

	describe( 'getBlockAttributes()', () => {
		it( 'should merge attributes with the parsed and default attributes', () => {
			const blockType = {
				attributes: {
					content: {
						type: 'string',
						source: text( 'div' ),
					},
					number: {
						type: 'number',
						source: attr( 'div', 'data-number' ),
					},
					align: {
						type: 'string',
					},
					topic: {
						type: 'string',
						default: 'none',
					},
					ignoredDomSource: {
						type: 'string',
						source: ( node ) => node.innerHTML,
					},
				},
			};

			const rawContent = '<div data-number="10">Ribs</div>';
			const attrs = { align: 'left', invalid: true };

			expect( getBlockAttributes( blockType, rawContent, attrs ) ).toEqual( {
				content: 'Ribs',
				number: 10,
				align: 'left',
				topic: 'none',
			} );
		} );
	} );

	describe( 'createBlockWithFallback', () => {
		it( 'should create the requested block if it exists', () => {
			const block = createBlockWithFallback(
				'core/test-block',
				'content',
				{ fruit: 'Bananas' },
				{ blockTypes: [ defaultBlockType ] }
			);
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( { fruit: 'Bananas' } );
		} );

		it( 'should create the requested block with no attributes if it exists', () => {
			const block = createBlockWithFallback(
				'core/test-block',
				'content',
				undefined,
				{ blockTypes: [ defaultBlockType ] }
			);
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( {} );
		} );

		it( 'should fall back to the unknown type handler for unknown blocks if present', () => {
			const unknownBlockType = {
				...defaultBlockType,
				name: 'core/unknown-block',
			};
			const config = {
				blockTypes: [ unknownBlockType ],
				fallbackBlockName: 'core/unknown-block',
			};

			const block = createBlockWithFallback(
				'core/test-block',
				'content',
				{ fruit: 'Bananas' },
				config
			);
			expect( block.name ).toEqual( 'core/unknown-block' );
			expect( block.attributes ).toEqual( { fruit: 'Bananas' } );
		} );

		it( 'should fall back to the unknown type handler if block type not specified', () => {
			const unknownBlockType = {
				...defaultBlockType,
				name: 'core/unknown-block',
			};
			const config = {
				blockTypes: [ unknownBlockType ],
				fallbackBlockName: 'core/unknown-block',
			};

			const block = createBlockWithFallback( null, 'content', undefined, config );
			expect( block.name ).toEqual( 'core/unknown-block' );
			expect( block.attributes ).toEqual( {} );
		} );

		it( 'should not create a block if no unknown type handler', () => {
			const config = {
				blockTypes: [],
			};
			const block = createBlockWithFallback( 'core/test-block', 'content', undefined, config );
			expect( block ).toBeUndefined();
		} );
	} );

	describe( 'parse()', () => {
		it( 'should parse the post content, including block attributes', () => {
			const testBlockType = {
				name: 'core/test-block',
				attributes: {
					content: {
						type: 'string',
						source: text(),
					},
					smoked: { type: 'string' },
					url: { type: 'string' },
					chicken: { type: 'string' },
				},
				save: noop,
				category: 'common',
			};
			const config = {
				blockTypes: [ testBlockType ],
			};

			const parsed = parse(
				'<!-- wp:core/test-block {"smoked":"yes","url":"http://google.com","chicken":"ribs & \'wings\'"} -->' +
				'Brisket' +
				'<!-- /wp:core/test-block -->',
				config
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
			const parsed = parse( '', { blockTypes: [] } );

			expect( parsed ).toEqual( [] );
		} );

		it( 'should parse the post content, ignoring unknown blocks', () => {
			const blockType = {
				name: 'core/test-block',
				attributes: {
					content: {
						type: 'string',
						source: text(),
					},
				},
				save: noop,
				category: 'common',
			};
			const config = {
				blockTypes: [ blockType ],
			};

			const parsed = parse(
				'<!-- wp:core/test-block -->\nRibs\n<!-- /wp:core/test-block -->' +
				'<p>Broccoli</p>' +
				'<!-- wp:core/unknown-block -->Ribs<!-- /wp:core/unknown-block -->',
				config
			);

			expect( parsed ).toHaveLength( 1 );
			expect( parsed[ 0 ].name ).toBe( 'core/test-block' );
			expect( parsed[ 0 ].attributes ).toEqual( {
				content: 'Ribs',
			} );
			expect( typeof parsed[ 0 ].uid ).toBe( 'string' );
		} );

		it( 'should parse the post content, using unknown block handler', () => {
			const unknownBlockType = {
				...defaultBlockType,
				name: 'core/unknown-block',
			};

			const config = {
				blockTypes: [ defaultBlockType, unknownBlockType ],
				fallbackBlockName: 'core/unknown-block',
			};

			const parsed = parse(
				'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
				'<p>Broccoli</p>' +
				'<!-- wp:core/unknown-block -->Ribs<!-- /wp:core/unknown-block -->',
				config
			);

			expect( parsed ).toHaveLength( 3 );
			expect( parsed.map( ( { name } ) => name ) ).toEqual( [
				'core/test-block',
				'core/unknown-block',
				'core/unknown-block',
			] );
		} );

		it( 'should parse the post content, including raw HTML at each end', () => {
			const unknownBlockType = {
				name: 'core/unknown-block',
				attributes: {
					content: {
						type: 'string',
						source: html(),
					},
				},
				save: noop,
				category: 'common',
			};

			const config = {
				blockTypes: [ defaultBlockType, unknownBlockType ],
				fallbackBlockName: 'core/unknown-block',
			};

			const parsed = parse(
				'<p>Cauliflower</p>' +
				'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
				'\n<p>Broccoli</p>\n' +
				'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
				'<p>Romanesco</p>',
				config
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
			const config = {
				blockTypes: [ defaultBlockType ],
			};
			const parsed = parse(
				'<!-- wp:core/test-block --><!-- /wp:core/test-block -->',
				config
			);

			expect( parsed ).toHaveLength( 1 );
			expect( parsed.map( ( { name } ) => name ) ).toEqual( [
				'core/test-block',
			] );
		} );

		it( 'should parse void blocks', () => {
			const voidBlockType = {
				...defaultBlockType,
				name: 'core/void-block',
			};
			const config = {
				blockTypes: [ defaultBlockType, voidBlockType ],
			};
			const parsed = parse(
				'<!-- wp:core/test-block --><!-- /wp:core/test-block -->' +
				'<!-- wp:core/void-block /-->',
				config
			);

			expect( parsed ).toHaveLength( 2 );
			expect( parsed.map( ( { name } ) => name ) ).toEqual( [
				'core/test-block', 'core/void-block',
			] );
		} );
	} );
} );
