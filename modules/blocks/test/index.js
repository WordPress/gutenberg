/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import * as blocks from '../';

describe( 'blocks API', () => {
	// Reset block state before each test.
	beforeEach( () => {
		blocks.getBlocks().forEach( block => {
			blocks.unregisterBlock( block.slug );
		} );
	} );

	describe( 'registerBlock', () => {
		it( 'should reject numbers', () => {
			expect(
				() => blocks.registerBlock( 999 )
			).to.throw( 'Block slugs must be strings.' );
		} );

		it( 'should reject blocks without a namespace', () => {
			expect(
				() => blocks.registerBlock( 'doing-it-wrong' )
			).to.throw( /^Block slugs must contain a namespace prefix/ );
		} );

		it( 'should reject blocks with invalid characters', () => {
			expect(
				() => blocks.registerBlock( 'still/_doing_it_wrong' )
			).to.throw( /^Block slugs must contain a namespace prefix/ );
		} );

		it( 'should accept valid block names', () => {
			expect(
				() => blocks.registerBlock( 'my-plugin/fancy-block-4' )
			).not.to.throw();
		} );

		it( 'should prohibit registering the same block twice', () => {
			blocks.registerBlock( 'core/test-block' );
			expect(
				() => blocks.registerBlock( 'core/test-block' )
			).to.throw( 'Block "core/test-block" is already registered.' );
		} );

		it( 'should store a copy of block settings', () => {
			const blockSettings = { settingName: 'settingValue' };
			blocks.registerBlock( 'core/test-block-with-settings', blockSettings );
			blockSettings.mutated = true;
			expect( blocks.getBlockSettings( 'core/test-block-with-settings' ) ).to.eql( {
				slug: 'core/test-block-with-settings',
				settingName: 'settingValue',
			} );
		} );
	} );

	describe( 'unregisterBlock', () => {
		it( 'should fail if a block is not registered', () => {
			expect(
				() => blocks.unregisterBlock( 'core/test-block' )
			).to.throw( 'Block "core/test-block" is not registered.' );
		} );

		it( 'should unregister existing blocks', () => {
			blocks.registerBlock( 'core/test-block' );
			expect( blocks.getBlocks() ).to.eql( [
				{ slug: 'core/test-block' },
			] );
			blocks.unregisterBlock( 'core/test-block' );
			expect( blocks.getBlocks() ).to.eql( [] );
		} );
	} );

	describe( 'getBlockSettings', () => {
		it( 'should return { slug } for blocks with no settings', () => {
			blocks.registerBlock( 'core/test-block' );
			expect( blocks.getBlockSettings( 'core/test-block' ) ).to.eql( {
				slug: 'core/test-block',
			} );
		} );

		it( 'should return all block settings', () => {
			const blockSettings = { settingName: 'settingValue' };
			blocks.registerBlock( 'core/test-block-with-settings', blockSettings );
			expect( blocks.getBlockSettings( 'core/test-block-with-settings' ) ).to.eql( {
				slug: 'core/test-block-with-settings',
				settingName: 'settingValue',
			} );
		} );
	} );

	describe( 'getBlocks', () => {
		it( 'should return an empty array at first', () => {
			expect( blocks.getBlocks() ).to.eql( [] );
		} );

		it( 'should return all registered blocks', () => {
			blocks.registerBlock( 'core/test-block' );
			const blockSettings = { settingName: 'settingValue' };
			blocks.registerBlock( 'core/test-block-with-settings', blockSettings );
			expect( blocks.getBlocks() ).to.eql( [
				{ slug: 'core/test-block' },
				{ slug: 'core/test-block-with-settings', settingName: 'settingValue' },
			] );
		} );
	} );
} );
