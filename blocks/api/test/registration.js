/* eslint-disable no-console */

/**
 * External dependencies
 */
import { noop } from 'lodash';

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
	registrationFlags,
} from '../registration';

describe( 'blocks', () => {
	const error = console.error;
	const defaultBlockSettings = { save: noop };

	// Reset block state before each test.
	beforeEach( () => {
		console.error = jest.fn();
		registrationFlags.ALLOW_CORE_NAMESPACES = false;
	} );

	afterEach( () => {
		getBlockTypes().forEach( block => {
			unregisterBlockType( block.name );
		} );
		setUnknownTypeHandler( undefined );
		setDefaultBlock( undefined );
		console.error = error;
	} );

	describe( 'registerBlockType()', () => {
		it( 'should reject numbers', () => {
			const block = registerBlockType( 999 );
			expect( console.error ).toHaveBeenCalledWith( 'Block names must be strings.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks without a namespace', () => {
			const block = registerBlockType( 'doing-it-wrong' );
			expect( console.error ).toHaveBeenCalledWith( 'Block names must contain a namespace prefix. Example: my-plugin/my-custom-block' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with too many namespaces', () => {
			const block = registerBlockType( 'doing/it/wrong' );
			expect( console.error ).toHaveBeenCalledWith( 'Block names must contain a namespace prefix. Example: my-plugin/my-custom-block' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with invalid characters', () => {
			const block = registerBlockType( 'still/_doing_it_wrong' );
			expect( console.error ).toHaveBeenCalledWith( 'Block names must contain a namespace prefix. Example: my-plugin/my-custom-block' );
			expect( block ).toBeUndefined();
		} );

		it( 'should prohibit registering blocks in the "core" namespace', () => {
			const block = registerBlockType( 'core/some-plugin-block' );
			expect( console.error ).toHaveBeenCalledWith(
				'Plugins may not register blocks in the "core" or "core-*" namespaces.'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should prohibit registering blocks in other "core-*" namespaces', () => {
			const block = registerBlockType( 'core-but-not-really/some-plugin-block' );
			expect( console.error ).toHaveBeenCalledWith(
				'Plugins may not register blocks in the "core" or "core-*" namespaces.'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should allow registering blocks in namespaces that start with "core" but not "core-"', () => {
			const block = registerBlockType( 'corepress/some-block', defaultBlockSettings );
			expect( console.error ).not.toHaveBeenCalled();
			expect( block ).toEqual( { name: 'corepress/some-block', save: noop } );
		} );

		it( 'should allow registering core blocks if the ALLOW_CORE_NAMESPACES flag is set', () => {
			registrationFlags.ALLOW_CORE_NAMESPACES = true;
			const block1 = registerBlockType( 'core/test-block', defaultBlockSettings );
			const block2 = registerBlockType( 'core-embed/test-embed', defaultBlockSettings );
			expect( console.error ).not.toHaveBeenCalled();
			expect( block1 ).toEqual( { name: 'core/test-block', save: noop } );
			expect( block2 ).toEqual( { name: 'core-embed/test-embed', save: noop } );
		} );

		it( 'should accept valid block names', () => {
			const block = registerBlockType( 'my-plugin/fancy-block-4', defaultBlockSettings );
			expect( console.error ).not.toHaveBeenCalled();
			expect( block ).toEqual( { name: 'my-plugin/fancy-block-4', save: noop } );
		} );

		it( 'should prohibit registering the same block twice', () => {
			registerBlockType( 'not-core/test-block', defaultBlockSettings );
			const block = registerBlockType( 'not-core/test-block', defaultBlockSettings );
			expect( console.error ).toHaveBeenCalledWith( 'Block "not-core/test-block" is already registered.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks without a save function', () => {
			const block = registerBlockType( 'my-plugin/fancy-block-5' );
			expect( console.error ).toHaveBeenCalledWith( 'The "save" property must be specified and must be a valid function.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with an invalid edit function', () => {
			const blockType = { save: noop, edit: 'not-a-function' },
				block = registerBlockType( 'my-plugin/fancy-block-6', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The "edit" property must be a valid function.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with more than 3 keywords', () => {
			const blockType = { save: noop, keywords: [ 'apple', 'orange', 'lemon', 'pineapple' ] },
				block = registerBlockType( 'my-plugin/fancy-block-7', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The block "my-plugin/fancy-block-7" can have a maximum of 3 keywords.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should store a copy of block type', () => {
			const blockType = { settingName: 'settingValue', save: noop };
			registerBlockType( 'not-core/test-block-with-settings', blockType );
			blockType.mutated = true;
			expect( getBlockType( 'not-core/test-block-with-settings' ) ).toEqual( {
				name: 'not-core/test-block-with-settings',
				settingName: 'settingValue',
				save: noop,
			} );
		} );
	} );

	describe( 'unregisterBlockType()', () => {
		it( 'should fail if a block is not registered', () => {
			const oldBlock = unregisterBlockType( 'not-core/test-block' );
			expect( console.error ).toHaveBeenCalledWith( 'Block "not-core/test-block" is not registered.' );
			expect( oldBlock ).toBeUndefined();
		} );

		it( 'should unregister existing blocks', () => {
			registerBlockType( 'not-core/test-block', defaultBlockSettings );
			expect( getBlockTypes() ).toEqual( [
				{ name: 'not-core/test-block', save: noop },
			] );
			const oldBlock = unregisterBlockType( 'not-core/test-block' );
			expect( console.error ).not.toHaveBeenCalled();
			expect( oldBlock ).toEqual( { name: 'not-core/test-block', save: noop } );
			expect( getBlockTypes() ).toEqual( [] );
		} );
	} );

	describe( 'setUnknownTypeHandler()', () => {
		it( 'assigns unknown type handler', () => {
			setUnknownTypeHandler( 'not-core/test-block' );

			expect( getUnknownTypeHandler() ).toBe( 'not-core/test-block' );
		} );
	} );

	describe( 'getUnknownTypeHandler()', () => {
		it( 'defaults to undefined', () => {
			expect( getUnknownTypeHandler() ).toBeUndefined();
		} );
	} );

	describe( 'setDefaultBlock()', () => {
		it( 'assigns default block name', () => {
			setDefaultBlock( 'not-core/test-block' );

			expect( getDefaultBlock() ).toBe( 'not-core/test-block' );
		} );
	} );

	describe( 'getDefaultBlock()', () => {
		it( 'defaults to undefined', () => {
			expect( getDefaultBlock() ).toBeUndefined();
		} );
	} );

	describe( 'getBlockType()', () => {
		it( 'should return { name, save } for blocks with minimum settings', () => {
			registerBlockType( 'not-core/test-block', defaultBlockSettings );
			expect( getBlockType( 'not-core/test-block' ) ).toEqual( {
				name: 'not-core/test-block',
				save: noop,
			} );
		} );

		it( 'should return all block type elements', () => {
			const blockType = { settingName: 'settingValue', save: noop };
			registerBlockType( 'not-core/test-block-with-settings', blockType );
			expect( getBlockType( 'not-core/test-block-with-settings' ) ).toEqual( {
				name: 'not-core/test-block-with-settings',
				settingName: 'settingValue',
				save: noop,
			} );
		} );
	} );

	describe( 'getBlockTypes()', () => {
		it( 'should return an empty array at first', () => {
			expect( getBlockTypes() ).toEqual( [] );
		} );

		it( 'should return all registered blocks', () => {
			registerBlockType( 'not-core/test-block', defaultBlockSettings );
			const blockType = { settingName: 'settingValue', save: noop };
			registerBlockType( 'not-core/test-block-with-settings', blockType );
			expect( getBlockTypes() ).toEqual( [
				{ name: 'not-core/test-block', save: noop },
				{
					name: 'not-core/test-block-with-settings',
					settingName: 'settingValue',
					save: noop,
				},
			] );
		} );
	} );
} );
