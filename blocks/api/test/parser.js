/**
 * External dependencies
 */
import { expect } from 'chai';
import { text } from 'hpq';

/**
 * Internal dependencies
 */
import query from '../query';
import {
	getBlockAttributes,
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

	describe( 'getBlockAttributes()', () => {
		it( 'should merge attributes with the parsed and default attributes', () => {
			const blockSettings = {
				attributes: {
					content: {
						source: 'content',
						parse: text( 'strong' )
					},
					align: {
						source: 'metadata',
						name: 'alignment'
					}
				},
				defaultAttributes: {
					topic: 'none'
				}
			};

			const rawContent = '<strong>Ribs</strong>';
			const attrs = { alignment: 'left' };

			expect( getBlockAttributes( blockSettings, rawContent, attrs ) ).to.eql( {
				align: 'left',
				topic: 'none',
				content: 'Ribs'
			} );
		} );
	} );

	describe( 'createBlockWithFallback', () => {
		it( 'should create the requested block if it exists', () => {
			registerBlock( 'core/test-block', {
				attributes: {
					attr: query.metadata( 'attr' )
				}
			} );

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
			expect( block.attributes ).to.eql( {} );
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
						attributes: {
							content: query.text( 'strong' ),
							smoked: query.metadata( 'smoked' ),
							url: query.metadata( 'url' ),
							chicken: query.metadata( 'chicken' ),
							checked: query.metadata( 'checked' )
						}
					} );

					const parsed = parse(
						'<!-- wp:core/test-block smoked="yes" url="http://google.com" chicken="ribs & \'wings\'" checked -->' +
						'<strong>Brisket</strong>' +
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
						attributes: {
							content: query.text( 'strong' ),
						}
					} );

					const parsed = parse(
						'<!-- wp:core/test-block -->\n<strong>Ribs</strong>\n<!-- /wp:core/test-block -->' +
						'<p>Broccoli</p>' +
						'<!-- wp:core/unknown-block -->Ribs<!-- /wp:core/unknown-block -->'
					);

					expect( parsed ).to.have.lengthOf( 1 );
					expect( parsed[ 0 ].blockType ).to.equal( 'core/test-block' );
					expect( parsed[ 0 ].attributes ).to.eql( {
						content: 'Ribs'
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
						attributes: {
							content: query.html(),
						}
					} );

					setUnknownTypeHandler( 'core/unknown-block' );

					const parsed = parse(
						'<p>Cauliflower</p>' +
						'<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
						'\n<p>Broccoli</p>\n' +
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
