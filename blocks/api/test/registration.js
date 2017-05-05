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
	validateBlockSettings
} from '../registration';
import {
	edit,
	save
} from './function-refs';

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
			const block = registerBlock( 'my-plugin/fancy-block-4', {
				settingName: 'settingValue',
				edit: edit,
				save: save
			} );
			expect( console.error ).to.not.have.been.called();
			expect( block ).to.eql( {
				slug: 'my-plugin/fancy-block-4',
				settingName: 'settingValue',
				edit: edit,
				save: save
			} );
		} );

		it( 'should prohibit registering the same block twice', () => {
			registerBlock( 'core/test-block', {
				settingName: 'settingValue',
				edit: edit,
				save: save
			} );
			const block = registerBlock( 'core/test-block' );
			expect( console.error ).to.have.been.calledWith( 'Block "core/test-block" is already registered.' );
			expect( block ).to.be.undefined();
		} );

		it( 'should store a copy of block settings', () => {
			const blockSettings = {
				settingName: 'settingValue',
				edit: edit,
				save: save
			};
			registerBlock( 'core/test-block-with-settings', blockSettings );
			blockSettings.mutated = true;
			expect( getBlockSettings( 'core/test-block-with-settings' ) ).to.eql( {
				slug: 'core/test-block-with-settings',
				settingName: 'settingValue',
				edit: edit,
				save: save
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
			registerBlock( 'core/test-block', {
				settingName: 'settingValue',
				edit: edit,
				save: save
			} );
			expect( getBlocks() ).to.deep.equal( [
				{
					slug: 'core/test-block',
					settingName: 'settingValue',
					edit: edit,
					save: save
				}
			] );
			const oldBlock = unregisterBlock( 'core/test-block' );
			expect( console.error ).to.not.have.been.called();
			expect( oldBlock ).to.deep.eql( {
				slug: 'core/test-block',
				settingName: 'settingValue',
				edit: edit,
				save: save
			} );
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
		it( 'should return all block settings', () => {
			const blockSettings = {
				settingName: 'settingValue',
				edit: edit,
				save: save
			};
			registerBlock( 'core/test-block-with-settings', blockSettings );
			expect( getBlockSettings( 'core/test-block-with-settings' ) ).to.eql( {
				slug: 'core/test-block-with-settings',
				settingName: 'settingValue',
				edit: edit,
				save: save
			} );
		} );
	} );

	describe( 'getBlocks()', () => {
		it( 'should return an empty array at first', () => {
			expect( getBlocks() ).to.eql( [] );
		} );

		it( 'should return all registered blocks', () => {
			registerBlock( 'core/test-block', {
				edit: edit,
				save: save
			} );
			const blockSettings = {
				settingName: 'settingValue',
				edit: edit,
				save: save
			};
			registerBlock( 'core/test-block-with-settings', blockSettings );
			expect( getBlocks() ).to.eql( [
				{
					slug: 'core/test-block',
					edit: edit,
					save: save
				},
				{
					slug: 'core/test-block-with-settings',
					settingName: 'settingValue',
					edit: edit,
					save: save
				},
			] );
		} );
	} );

	describe( 'validateBlockSettings()', () => {
		it( 'should return true when edit() and save() are present', () => {
			const blockSettings = {
				settingName: 'settingValue',
				edit: edit,
				save: save
			};
			expect( validateBlockSettings( blockSettings ) ).to.eql( true );
		} );
		it( 'should return false when settings is falsy', () => {
			const blockSettings = {};
			expect( validateBlockSettings( blockSettings ) ).to.eql( false );
		} );
		it( 'should return false when settings does not contain save()', () => {
			const blockSettings = {
				setting: 'settingValue',
				edit: edit
			};
			expect( validateBlockSettings( blockSettings ) ).to.eql( false );
			expect( console.error ).to.have.been.called();
		} );
		it( 'should return false when settings does not contain edit()', () => {
			const blockSettings = {
				setting: 'settingValue',
				save: save
			};
			expect( validateBlockSettings( blockSettings ) ).to.eql( false );
			expect( console.error ).to.have.been.called();
		} );
		it( 'should return false when save is not a function', () => {
			const blockSettings = {
				setting: 'settingValue',
				edit: edit,
				save: 'notAFunction'
			};
			expect( validateBlockSettings( blockSettings ) ).to.eql( false );
			expect( console.error ).to.have.been.called();
		} );
		it( 'should return false when edit is not a function', () => {
			const blockSettings = {
				setting: 'settingValue',
				save: save,
				edit: 'notAFunction'
			};
			expect( validateBlockSettings( blockSettings ) ).to.eql( false );
			expect( console.error ).to.have.been.called();
		} );
	} );
} );
