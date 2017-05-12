/* eslint-disable no-console */

/**
 * External dependencies
 */
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import {
	registerBlock,
	unregisterBlock,
	setUnknownTypeHandler,
	getUnknownTypeHandler,
	getBlockSettings,
	getBlocks,
} from '../registration';

describe( 'blocks', () => {
	// Reset block state before each test.
	beforeEach( () => {
		sinon.stub( console, 'error' );
	} );

	afterEach( () => {
		getBlocks().forEach( block => {
			unregisterBlock( block.slug );
		} );
		setUnknownTypeHandler( undefined );
		console.error.restore();
	} );

	describe( 'registerBlock()', () => {
		it( 'should reject numbers', () => {
			const block = registerBlock( 999 );
			expect( console.error ).to.have.been.calledWith( 'Block slugs must be strings.' );
			expect( block ).to.be.undefined();
		} );

		it( 'should reject blocks without a namespace', () => {
			const block = registerBlock( 'doing-it-wrong' );
			expect( console.error ).to.have.been.calledWith( 'Block slugs must contain a namespace prefix. Example: my-plugin/my-custom-block' );
			expect( block ).to.be.undefined();
		} );

		it( 'should reject blocks with invalid characters', () => {
			const block = registerBlock( 'still/_doing_it_wrong' );
			expect( console.error ).to.have.been.calledWith( 'Block slugs must contain a namespace prefix. Example: my-plugin/my-custom-block' );
			expect( block ).to.be.undefined();
		} );

		it( 'should accept valid block names', () => {
			const block = registerBlock( 'my-plugin/fancy-block-4' );
			expect( console.error ).to.not.have.been.called();
			expect( block ).to.eql( { slug: 'my-plugin/fancy-block-4' } );
		} );

		it( 'should prohibit registering the same block twice', () => {
			registerBlock( 'core/test-block' );
			const block = registerBlock( 'core/test-block' );
			expect( console.error ).to.have.been.calledWith( 'Block "core/test-block" is already registered.' );
			expect( block ).to.be.undefined();
		} );

		it( 'should store a copy of block settings', () => {
			const blockSettings = { settingName: 'settingValue' };
			registerBlock( 'core/test-block-with-settings', blockSettings );
			blockSettings.mutated = true;
			expect( getBlockSettings( 'core/test-block-with-settings' ) ).to.eql( {
				slug: 'core/test-block-with-settings',
				settingName: 'settingValue',
			} );
		} );
	} );

	describe( 'unregisterBlock()', () => {
		it( 'should fail if a block is not registered', () => {
			const oldBlock = unregisterBlock( 'core/test-block' );
			expect( console.error ).to.have.been.calledWith( 'Block "core/test-block" is not registered.' );
			expect( oldBlock ).to.be.undefined();
		} );

		it( 'should unregister existing blocks', () => {
			registerBlock( 'core/test-block' );
			expect( getBlocks() ).to.eql( [
				{ slug: 'core/test-block' },
			] );
			const oldBlock = unregisterBlock( 'core/test-block' );
			expect( console.error ).to.not.have.been.called();
			expect( oldBlock ).to.eql( { slug: 'core/test-block' } );
			expect( getBlocks() ).to.eql( [] );
		} );
	} );

	describe( 'setUnknownTypeHandler()', () => {
		it( 'assigns unknown type handler', () => {
			setUnknownTypeHandler( 'core/test-block' );

			expect( getUnknownTypeHandler() ).to.equal( 'core/test-block' );
		} );
	} );

	describe( 'getUnknownTypeHandler()', () => {
		it( 'defaults to undefined', () => {
			expect( getUnknownTypeHandler() ).to.be.undefined();
		} );
	} );

	describe( 'getBlockSettings()', () => {
		it( 'should return { slug } for blocks with no settings', () => {
			registerBlock( 'core/test-block' );
			expect( getBlockSettings( 'core/test-block' ) ).to.eql( {
				slug: 'core/test-block',
			} );
		} );

		it( 'should return all block settings', () => {
			const blockSettings = { settingName: 'settingValue' };
			registerBlock( 'core/test-block-with-settings', blockSettings );
			expect( getBlockSettings( 'core/test-block-with-settings' ) ).to.eql( {
				slug: 'core/test-block-with-settings',
				settingName: 'settingValue',
			} );
		} );
	} );

	describe( 'getBlocks()', () => {
		it( 'should return an empty array at first', () => {
			expect( getBlocks() ).to.eql( [] );
		} );

		it( 'should return all registered blocks', () => {
			registerBlock( 'core/test-block' );
			const blockSettings = { settingName: 'settingValue' };
			registerBlock( 'core/test-block-with-settings', blockSettings );
			expect( getBlocks() ).to.eql( [
				{ slug: 'core/test-block' },
				{ slug: 'core/test-block-with-settings', settingName: 'settingValue' },
			] );
		} );
	} );
} );
