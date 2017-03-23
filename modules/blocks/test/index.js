/* eslint-disable no-console */

/**
 * External dependencies
 */
import { expect } from 'chai';
import sinon from 'sinon';

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
		sinon.stub( console, 'error' );
	} );

	afterEach( () => {
		console.error.restore();
	} );

	describe( 'registerBlock', () => {
		it( 'should reject numbers', () => {
			const block = blocks.registerBlock( 999 );
			expect( console.error ).to.have.been.calledWith( 'Block slugs must be strings.' );
			expect( block ).to.be.undefined();
		} );

		it( 'should reject blocks without a namespace', () => {
			const block = blocks.registerBlock( 'doing-it-wrong' );
			expect( console.error ).to.have.been.calledWith( 'Block slugs must contain a namespace prefix. Example: my-plugin/my-custom-block' );
			expect( block ).to.be.undefined();
		} );

		it( 'should reject blocks with invalid characters', () => {
			const block = blocks.registerBlock( 'still/_doing_it_wrong' );
			expect( console.error ).to.have.been.calledWith( 'Block slugs must contain a namespace prefix. Example: my-plugin/my-custom-block' );
			expect( block ).to.be.undefined();
		} );

		it( 'should accept valid block names', () => {
			const block = blocks.registerBlock( 'my-plugin/fancy-block-4' );
			expect( console.error ).to.not.have.been.called();
			expect( block ).to.eql( { slug: 'my-plugin/fancy-block-4' } );
		} );

		it( 'should prohibit registering the same block twice', () => {
			blocks.registerBlock( 'core/test-block' );
			const block = blocks.registerBlock( 'core/test-block' );
			expect( console.error ).to.have.been.calledWith( 'Block "core/test-block" is already registered.' );
			expect( block ).to.be.undefined();
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
			const oldBlock = blocks.unregisterBlock( 'core/test-block' );
			expect( console.error ).to.have.been.calledWith( 'Block "core/test-block" is not registered.' );
			expect( oldBlock ).to.be.undefined();
		} );

		it( 'should unregister existing blocks', () => {
			blocks.registerBlock( 'core/test-block' );
			expect( blocks.getBlocks() ).to.eql( [
				{ slug: 'core/test-block' },
			] );
			const oldBlock = blocks.unregisterBlock( 'core/test-block' );
			expect( console.error ).to.not.have.been.called();
			expect( oldBlock ).to.eql( { slug: 'core/test-block' } );
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
