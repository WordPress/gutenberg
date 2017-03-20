/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import * as blocks from 'blocks';

describe( 'blocks API', () => {
	// TODO: We probably want a way to undo this, and split this logic out into
	// separate tests (clearing require.cache for example, but this probably
	// won't work with webpack)
	before( () => {
		blocks.registerBlock( 'core/test-block' );
		const blockSettings = { settingName: 'settingValue' };
		blocks.registerBlock( 'core/test-block-with-settings', blockSettings );
		// This is tested later: `registerBlock` should store a copy of its input
		blockSettings.mutated = true;
	} );

	describe( 'validateBlockSlug', () => {
		it( 'should reject numbers', () => {
			expect(
				() => blocks.validateBlockSlug( 999 )
			).to.throw( /^Block slugs must contain a namespace prefix/ );
		} );

		it( 'should reject blocks without a namespace', () => {
			expect(
				() => blocks.validateBlockSlug( 'doing-it-wrong' )
			).to.throw( /^Block slugs must contain a namespace prefix/ );
		} );

		it( 'should reject blocks with invalid characters', () => {
			expect(
				() => blocks.validateBlockSlug( 'still/_doing_it_wrong' )
			).to.throw( /^Block slugs must contain a namespace prefix/ );
		} );

		it( 'should accept valid block names', () => {
			expect(
				() => blocks.validateBlockSlug( 'my-plugin/fancy-block-4' )
			).not.to.throw();
		} );
	} );

	// TODO: registerBlock tests

	describe( 'getBlockSettings', () => {
		it( 'should return { slug } for blocks with no settings', () => {
			expect( blocks.getBlockSettings( 'core/test-block' ) ).to.eql( {
				slug: 'core/test-block',
			} );
		} );

		it( 'should return { slug } for blocks with no settings', () => {
			expect( blocks.getBlockSettings( 'core/test-block-with-settings' ) ).to.eql( {
				slug: 'core/test-block-with-settings',
				settingName: 'settingValue',
			} );
		} );
	} );

	describe( 'getBlocks', () => {
		it( 'should return all registered blocks', () => {
			expect( blocks.getBlocks() ).to.eql( [
				blocks.getBlockSettings( 'core/test-block' ),
				blocks.getBlockSettings( 'core/test-block-with-settings' ),
			] );
		} );
	} );

} );
