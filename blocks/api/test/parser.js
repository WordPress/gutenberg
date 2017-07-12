/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { text } from '../query';
import {
	getBlockAttributes,
	parseBlockAttributes,
	createBlockWithFallback,
	default as parse,
} from '../parser';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
	setUnknownTypeHandler,
} from '../registration';

describe( 'block parser', () => {
	const defaultBlockSettings = { save: noop };

	afterEach( () => {
		setUnknownTypeHandler( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'parseBlockAttributes()', () => {
		it( 'should use the function implementation', () => {
			const attributes = function( rawContent ) {
				return {
					content: rawContent + ' & Chicken',
				};
			};

			expect( parseBlockAttributes( 'Ribs', attributes ) ).toEqual( {
				content: 'Ribs & Chicken',
			} );
		} );

		it( 'should use the query object implementation', () => {
			const attributes = {
				emphasis: text( 'strong' ),
				ignoredDomMatcher: ( node ) => node.innerHTML,
			};

			const rawContent = '<span>Ribs <strong>& Chicken</strong></span>';

			expect( parseBlockAttributes( rawContent, attributes ) ).toEqual( {
				emphasis: '& Chicken',
			} );
		} );

		it( 'should return an empty object if no attributes defined', () => {
			const attributes = {};
			const rawContent = '<span>Ribs <strong>& Chicken</strong></span>';

			expect( parseBlockAttributes( rawContent, attributes ) ).toEqual( {} );
		} );
	} );

	describe( 'getBlockAttributes()', () => {
		it( 'should merge attributes with the parsed and default attributes', () => {
			const blockType = {
				attributes: function( rawContent ) {
					return {
						content: rawContent + ' & Chicken',
					};
				},
				defaultAttributes: {
					content: '',
					topic: 'none',
				},
			};

			const rawContent = 'Ribs';
			const attrs = { align: 'left' };

			expect( getBlockAttributes( blockType, rawContent, attrs ) ).toEqual( {
				align: 'left',
				topic: 'none',
				content: 'Ribs & Chicken',
			} );
		} );
	} );

	describe( 'createBlockWithFallback', () => {
		it( 'should create the requested block if it exists', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const block = createBlockWithFallback(
				'core/test-block',
				'content',
				{ attr: 'value' }
			);
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( { attr: 'value' } );
		} );

		it( 'should create the requested block with no attributes if it exists', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			const block = createBlockWithFallback( 'core/test-block', 'content' );
			expect( block.name ).toEqual( 'core/test-block' );
			expect( block.attributes ).toEqual( {} );
		} );

		it( 'should fall back to the unknown type handler for unknown blocks if present', () => {
			registerBlockType( 'core/unknown-block', defaultBlockSettings );
			setUnknownTypeHandler( 'core/unknown-block' );

			const block = createBlockWithFallback(
				'core/test-block',
				'content',
				{ attr: 'value' }
			);
			expect( block.name ).toEqual( 'core/unknown-block' );
			expect( block.attributes ).toEqual( { attr: 'value' } );
		} );

		it( 'should fall back to the unknown type handler if block type not specified', () => {
			registerBlockType( 'core/unknown-block', defaultBlockSettings );
			setUnknownTypeHandler( 'core/unknown-block' );

			const block = createBlockWithFallback( null, 'content' );
			expect( block.name ).toEqual( 'core/unknown-block' );
			expect( block.attributes ).toEqual( {} );
		} );

		it( 'should not create a block if no unknown type handler', () => {
			const block = createBlockWithFallback( 'core/test-block', 'content' );
			expect( block ).toBeUndefined();
		} );
	} );

	describe( 'parse()', () => {
		it( 'should parse the post content, including block attributes', () => {
			registerBlockType( 'core/test-block', {
				// Currently this is the only way to test block content parsing?
				attributes: function( rawContent ) {
					return {
						content: rawContent,
					};
				},
				save: noop,
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
				attributes: function( rawContent ) {
					return {
						content: rawContent + ' & Chicken',
					};
				},
				save: noop,
			} );

			const parsed = parse(
				'<!-- wp:core/test-block -->\nRibs\n<!-- /wp:core/test-block -->' +
				'<p>Broccoli</p>' +
				'<!-- wp:core/unknown-block -->Ribs<!-- /wp:core/unknown-block -->'
			);

			expect( parsed ).toHaveLength( 1 );
			expect( parsed[ 0 ].name ).toBe( 'core/test-block' );
			expect( parsed[ 0 ].attributes ).toEqual( {
				content: 'Ribs & Chicken',
			} );
			expect( typeof parsed[ 0 ].uid ).toBe( 'string' );
		} );

		it( 'should parse the post content, using unknown block handler', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			registerBlockType( 'core/unknown-block', defaultBlockSettings );

			setUnknownTypeHandler( 'core/unknown-block' );

			const parsed = parse(
				'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
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
			registerBlockType( 'core/unknown-block', {
				// Currently this is the only way to test block content parsing?
				attributes: function( rawContent ) {
					return {
						content: rawContent,
					};
				},
				save: noop,
			} );

			setUnknownTypeHandler( 'core/unknown-block' );

			const parsed = parse(
				'<p>Cauliflower</p>' +
				'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
				'\n<p>Broccoli</p>\n' +
				'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
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
