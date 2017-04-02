/**
 * External dependencies
 */
import { expect } from 'chai';
import { text } from 'hpq';

/**
 * Internal dependencies
 */
import { default as parse, getBlockAttributes } from '../parser';
import { getBlocks, unregisterBlock, setUnknownTypeHandler, registerBlock } from '../registration';

describe( 'block parser', () => {
	afterEach( () => {
		setUnknownTypeHandler( undefined );
		getBlocks().forEach( ( block ) => {
			unregisterBlock( block.slug );
		} );
	} );

	describe( 'getBlockAttributes()', () => {
		it( 'should merge attributes from function implementation', () => {
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

		it( 'should merge attributes from query object implementation', () => {
			const blockSettings = {
				attributes: {
					emphasis: text( 'strong' )
				}
			};

			const blockNode = {
				blockType: 'core/test-block',
				attrs: {
					align: 'left'
				},
				rawContent: '<span>Ribs <strong>& Chicken</strong></span>'
			};

			expect( getBlockAttributes( blockNode, blockSettings ) ).to.eql( {
				align: 'left',
				emphasis: '& Chicken'
			} );
		} );

		it( 'should return parsed attributes for block without attributes defined', () => {
			const blockSettings = {};

			const blockNode = {
				blockType: 'core/test-block',
				attrs: {
					align: 'left'
				},
				rawContent: '<span>Ribs <strong>& Chicken</strong></span>'
			};

			expect( getBlockAttributes( blockNode, blockSettings ) ).to.eql( {
				align: 'left'
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

			expect( parsed ).to.eql( [ {
				blockType: 'core/test-block',
				attributes: {
					content: 'Ribs & Chicken'
				},
				rawContent: 'Ribs'
			} ] );
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
