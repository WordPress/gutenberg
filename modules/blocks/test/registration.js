/**
 * External dependencies
 */
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import * as blocks from '../registration';

/* eslint-disable no-console */
describe( 'blocks API', () => {
	// Reset block state before each test.
	beforeEach( () => {
		blocks.getBlocks().forEach( block => {
			blocks.unregisterBlock( block.slug );
		} );
		sinon.spy( console, 'error' );
	} );

	afterEach( () => {
		console.error.restore();
	} );

	describe( 'registerBlock', () => {
		it( 'should reject numbers', () => {
			const isRegistered = blocks.registerBlock( 999 );
			expect( console.error ).to.have.been.calledWith( 'Block slugs must be strings.' );
			expect( isRegistered ).to.eql( false );
		} );

		it( 'should reject blocks without a namespace', () => {
			const isRegistered = blocks.registerBlock( 'doing-it-wrong' );
			expect( console.error ).to.have.been.calledWith( 'Block slugs must contain a namespace prefix. Example: my-plugin/my-custom-block' );
			expect( isRegistered ).to.eql( false );
		} );

		it( 'should reject blocks with invalid characters', () => {
			const isRegistered = blocks.registerBlock( 'still/_doing_it_wrong' );
			expect( console.error ).to.have.been.calledWith( 'Block slugs must contain a namespace prefix. Example: my-plugin/my-custom-block' );
			expect( isRegistered ).to.eql( false );
		} );

		it( 'should accept valid block names', () => {
			const isRegistered = blocks.registerBlock( 'my-plugin/fancy-block-4' );
			expect( console.error ).to.not.have.been.called();
			expect( isRegistered ).to.eql( true );
		} );

		it( 'should prohibit registering the same block twice', () => {
			blocks.registerBlock( 'core/test-block' );
			const isRegistered = blocks.registerBlock( 'core/test-block' );
			expect( console.error ).to.have.been.calledWith( 'Block "core/test-block" is already registered.' );
			expect( isRegistered ).to.eql( false );
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
