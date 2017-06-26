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
	registerBlockType,
	unregisterBlockType,
	setUnknownTypeHandler,
	getUnknownTypeHandler,
	setDefaultBlock,
	getDefaultBlock,
	getBlockType,
	getBlockTypes,
} from '../registration';

describe( 'blocks', () => {
	// Reset block state before each test.
	beforeEach( () => {
		sinon.stub( console, 'error' );
	} );

	afterEach( () => {
		getBlockTypes().forEach( block => {
			unregisterBlockType( block.name );
		} );
		setUnknownTypeHandler( undefined );
		setDefaultBlock( undefined );
		console.error.restore();
	} );

	describe( 'registerBlockType()', () => {
		it( 'should reject numbers', () => {
			const block = registerBlockType( 999 );
			expect( console.error ).to.have.been.calledWith( 'Block names must be strings.' );
			expect( block ).to.be.undefined();
		} );

		it( 'should reject blocks without a namespace', () => {
			const block = registerBlockType( 'doing-it-wrong' );
			expect( console.error ).to.have.been.calledWith( 'Block names must contain a namespace prefix. Example: my-plugin/my-custom-block' );
			expect( block ).to.be.undefined();
		} );

		it( 'should reject blocks with invalid characters', () => {
			const block = registerBlockType( 'still/_doing_it_wrong' );
			expect( console.error ).to.have.been.calledWith( 'Block names must contain a namespace prefix. Example: my-plugin/my-custom-block' );
			expect( block ).to.be.undefined();
		} );

		it( 'should accept valid block names', () => {
			const block = registerBlockType( 'my-plugin/fancy-block-4' );
			expect( console.error ).to.not.have.been.called();
			expect( block ).to.eql( { name: 'my-plugin/fancy-block-4' } );
		} );

		it( 'should prohibit registering the same block twice', () => {
			registerBlockType( 'core/test-block' );
			const block = registerBlockType( 'core/test-block' );
			expect( console.error ).to.have.been.calledWith( 'Block "core/test-block" is already registered.' );
			expect( block ).to.be.undefined();
		} );

		it( 'should store a copy of block type', () => {
			const blockType = { settingName: 'settingValue' };
			registerBlockType( 'core/test-block-with-settings', blockType );
			blockType.mutated = true;
			expect( getBlockType( 'core/test-block-with-settings' ) ).to.eql( {
				name: 'core/test-block-with-settings',
				settingName: 'settingValue',
			} );
		} );
	} );

	describe( 'unregisterBlockType()', () => {
		it( 'should fail if a block is not registered', () => {
			const oldBlock = unregisterBlockType( 'core/test-block' );
			expect( console.error ).to.have.been.calledWith( 'Block "core/test-block" is not registered.' );
			expect( oldBlock ).to.be.undefined();
		} );

		it( 'should unregister existing blocks', () => {
			registerBlockType( 'core/test-block' );
			expect( getBlockTypes() ).to.eql( [
				{ name: 'core/test-block' },
			] );
			const oldBlock = unregisterBlockType( 'core/test-block' );
			expect( console.error ).to.not.have.been.called();
			expect( oldBlock ).to.eql( { name: 'core/test-block' } );
			expect( getBlockTypes() ).to.eql( [] );
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

	describe( 'setDefaultBlock()', () => {
		it( 'assigns default block name', () => {
			setDefaultBlock( 'core/test-block' );

			expect( getDefaultBlock() ).to.equal( 'core/test-block' );
		} );
	} );

	describe( 'getDefaultBlock()', () => {
		it( 'defaults to undefined', () => {
			expect( getDefaultBlock() ).to.be.undefined();
		} );
	} );

	describe( 'getBlockType()', () => {
		it( 'should return { name } for blocks with no settings', () => {
			registerBlockType( 'core/test-block' );
			expect( getBlockType( 'core/test-block' ) ).to.eql( {
				name: 'core/test-block',
			} );
		} );

		it( 'should return all block type elements', () => {
			const blockType = { settingName: 'settingValue' };
			registerBlockType( 'core/test-block-with-settings', blockType );
			expect( getBlockType( 'core/test-block-with-settings' ) ).to.eql( {
				name: 'core/test-block-with-settings',
				settingName: 'settingValue',
			} );
		} );
	} );

	describe( 'getBlockTypes()', () => {
		it( 'should return an empty array at first', () => {
			expect( getBlockTypes() ).to.eql( [] );
		} );

		it( 'should return all registered blocks', () => {
			registerBlockType( 'core/test-block' );
			const blockType = { settingName: 'settingValue' };
			registerBlockType( 'core/test-block-with-settings', blockType );
			expect( getBlockTypes() ).to.eql( [
				{ name: 'core/test-block' },
				{ name: 'core/test-block-with-settings', settingName: 'settingValue' },
			] );
		} );
	} );
} );
