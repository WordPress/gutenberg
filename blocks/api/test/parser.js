/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { text } from '../query';
import {
	getBlockAttributes,
	parseBlockAttributes,
	createBlockWithFallback,
	parseWithGrammar,
	parseWithTinyMCE
} from '../parser';
import {
	registerBlock,
	unregisterBlock,
	getBlocks,
	setUnknownTypeHandler,
} from '../registration';

describe( 'block parser', () => {
	afterEach( () => {
		setUnknownTypeHandler( undefined );
		getBlocks().forEach( ( block ) => {
			unregisterBlock( block.slug );
		} );
	} );

	describe( 'parseBlockAttributes()', () => {
		it( 'should use the function implementation', () => {
			const blockSettings = {
				attributes: function( rawContent ) {
					return {
						content: rawContent + ' & Chicken'
					};
				}
			};

			expect( parseBlockAttributes( 'Ribs', blockSettings ) ).to.eql( {
				content: 'Ribs & Chicken'
			} );
		} );

		it( 'should use the query object implementation', () => {
			const blockSettings = {
				attributes: {
					emphasis: text( 'strong' ),
					ignoredDomMatcher: ( node ) => node.innerHTML
				}
			};

			const rawContent = '<span>Ribs <strong>& Chicken</strong></span>';

			expect( parseBlockAttributes( rawContent, blockSettings ) ).to.eql( {
				emphasis: '& Chicken'
			} );
		} );

		it( 'should return an empty object if no attributes defined', () => {
			const blockSettings = {};
			const rawContent = '<span>Ribs <strong>& Chicken</strong></span>';

			expect( parseBlockAttributes( rawContent, blockSettings ) ).to.eql( {} );
		} );
	} );

	describe( 'getBlockAttributes()', () => {
		it( 'should merge attributes with the parsed and default attributes', () => {
			const blockSettings = {
				attributes: function( rawContent ) {
					return {
						content: rawContent + ' & Chicken'
					};
				},
				defaultAttributes: {
					topic: 'none'
				}
			};

			const rawContent = 'Ribs';
			const attrs = { align: 'left' };

			expect( getBlockAttributes( blockSettings, rawContent, attrs ) ).to.eql( {
				align: 'left',
				topic: 'none',
				content: 'Ribs & Chicken'
			} );
		} );
	} );

	describe( 'createBlockWithFallback', () => {
		it( 'should create the requested block if it exists', () => {
			registerBlock( 'core/test-block', {} );

			const block = createBlockWithFallback(
				'core/test-block',
				'content',
				{ attr: 'value' }
			);
			expect( block.blockType ).to.eql( 'core/test-block' );
			expect( block.attributes ).to.eql( { attr: 'value' } );
		} );

		it( 'should create the requested block with no attributes if it exists', () => {
			registerBlock( 'core/test-block', {} );

			const block = createBlockWithFallback( 'core/test-block', 'content' );
			expect( block.blockType ).to.eql( 'core/test-block' );
			expect( block.attributes ).to.eql( {} );
		} );

		it( 'should fall back to the unknown type handler for unknown blocks if present', () => {
			registerBlock( 'core/unknown-block', {} );
			setUnknownTypeHandler( 'core/unknown-block' );

			const block = createBlockWithFallback(
				'core/test-block',
				'content',
				{ attr: 'value' }
			);
			expect( block.blockType ).to.eql( 'core/unknown-block' );
			expect( block.attributes ).to.eql( { attr: 'value' } );
		} );

		it( 'should fall back to the unknown type handler if block type not specified', () => {
			registerBlock( 'core/unknown-block', {} );
			setUnknownTypeHandler( 'core/unknown-block' );

			const block = createBlockWithFallback( null, 'content' );
			expect( block.blockType ).to.eql( 'core/unknown-block' );
			expect( block.attributes ).to.eql( {} );
		} );

		it( 'should not create a block if no unknown type handler', () => {
			const block = createBlockWithFallback( 'core/test-block', 'content' );
			expect( block ).to.be.undefined();
		} );
	} );

	describe( 'parse()', () => {
		const parsers = { parseWithTinyMCE, parseWithGrammar };
		Object.keys( parsers ).forEach( ( parser ) => {
			const parse = parsers[ parser ];
			describe( parser, () => {
				it( 'should parse the post content, including block attributes', () => {
					registerBlock( 'core/test-block', {
						// Currently this is the only way to test block content parsing?
						attributes: function( rawContent ) {
							return {
								content: rawContent,
							};
						}
					} );

					const parsed = parse(
						'<!-- wp:core/test-block smoked="yes" url="http://google.com" chicken="ribs & \'wings\'" checked -->' +
						'Brisket' +
						'<!-- /wp:core/test-block -->'
					);

					expect( parsed ).to.have.lengthOf( 1 );
					expect( parsed[ 0 ].blockType ).to.equal( 'core/test-block' );
					expect( parsed[ 0 ].attributes ).to.eql( {
						content: 'Brisket',
						smoked: 'yes',
						url: 'http://google.com',
						chicken: 'ribs & \'wings\'',
						checked: true
					} );
					expect( parsed[ 0 ].uid ).to.be.a( 'string' );
				} );

				it( 'should parse the post content, ignoring unknown blocks', () => {
					registerBlock( 'core/test-block', {
						attributes: function( rawContent ) {
							return {
								content: rawContent + ' & Chicken'
							};
						}
					} );

					const parsed = parse(
						'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
						'<p>Broccoli</p>' +
						'<!-- wp:core/unknown-block -->Ribs<!-- /wp:core/unknown-block -->'
					);

					expect( parsed ).to.have.lengthOf( 1 );
					expect( parsed[ 0 ].blockType ).to.equal( 'core/test-block' );
					expect( parsed[ 0 ].attributes ).to.eql( {
						content: 'Ribs & Chicken'
					} );
					expect( parsed[ 0 ].uid ).to.be.a( 'string' );
				} );

				it( 'should parse the post content, using unknown block handler', () => {
					registerBlock( 'core/test-block', {} );
					registerBlock( 'core/unknown-block', {} );

					setUnknownTypeHandler( 'core/unknown-block' );

					const parsed = parse(
						'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
						'<p>Broccoli</p>' +
						'<!-- wp:core/unknown-block -->Ribs<!-- /wp:core/unknown-block -->'
					);

					expect( parsed ).to.have.lengthOf( 3 );
					expect( parsed.map( ( { blockType } ) => blockType ) ).to.eql( [
						'core/test-block',
						'core/unknown-block',
						'core/unknown-block',
					] );
				} );

				it( 'should parse the post content, including raw HTML at each end', () => {
					registerBlock( 'core/test-block', {} );
					registerBlock( 'core/unknown-block', {
						// Currently this is the only way to test block content parsing?
						attributes: function( rawContent ) {
							return {
								content: rawContent,
							};
						}
					} );

					setUnknownTypeHandler( 'core/unknown-block' );

					const parsed = parse(
						'<p>Cauliflower</p>' +
						'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
						'<p>Broccoli</p>' +
						'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
						'<p>Romanesco</p>'
					);

					expect( parsed ).to.have.lengthOf( 5 );
					expect( parsed.map( ( { blockType } ) => blockType ) ).to.eql( [
						'core/unknown-block',
						'core/test-block',
						'core/unknown-block',
						'core/test-block',
						'core/unknown-block',
					] );
					expect( parsed[ 0 ].attributes.content ).to.eql( '<p>Cauliflower</p>' );
					expect( parsed[ 2 ].attributes.content ).to.eql( '<p>Broccoli</p>' );
					expect( parsed[ 4 ].attributes.content ).to.eql( '<p>Romanesco</p>' );
				} );
			} );
		} );
	} );
} );
