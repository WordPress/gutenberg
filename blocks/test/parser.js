/**
 * External dependencies
 */
import { expect } from 'chai';
import { text } from 'hpq';

/**
 * Internal dependencies
 */
import { default as parse, getBlockAttributes } from '../parser';
import { getBlocks, unregisterBlock, registerBlock } from '../registration';

describe( 'block parser', () => {
	beforeEach( () => {
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
		it( 'should parse the post content properly and ignore unknown blocks', () => {
			const blockSettings = {
				attributes: function( rawContent ) {
					return {
						content: rawContent + ' & Chicken'
					};
				}
			};
			registerBlock( 'core/test-block', blockSettings );

			const postContent = '<!-- wp:core/test-block -->Ribs<!-- /wp:core/test-block -->' +
				'<!-- wp:core/unknown-block -->Ribs<!-- /wp:core/unknown-block -->';

			expect( parse( postContent ) ).to.eql( [ {
				blockType: 'core/test-block',
				attributes: {
					content: 'Ribs & Chicken'
				}
			} ] );
		} );
	} );
} );
