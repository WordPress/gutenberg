/**
 * External dependencies
 */
import { expect } from 'chai';
import { text } from 'hpq';

/**
 * Internal dependencies
 */
import { default as parse, getBlockAttributes, parseBlockAttributes } from '../parser';
import { getBlocks, unregisterBlock, setUnknownTypeHandler, registerBlock } from '../registration';

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
					emphasis: text( 'strong' )
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
		it( 'should merge attributes with the parsed attributes', () => {
			const blockSettings = {
				attributes: function( rawContent ) {
					return {
						content: rawContent + ' & Chicken'
					};
				}
			};

			const blockNode = {
				blockType: 'core/test-block',
				attrs: {
					align: 'left'
				},
				rawContent: 'Ribs'
			};

			expect( getBlockAttributes( blockNode, blockSettings ) ).to.eql( {
				align: 'left',
				content: 'Ribs & Chicken'
			} );
		} );
	} );

	describe( 'parse()', () => {
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
				'core/unknown-block'
			] );
		} );
	} );
} );
