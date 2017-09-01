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
	setUnknownTypeHandlerName,
	getUnknownTypeHandlerName,
	setDefaultBlockName,
	getDefaultBlockName,
	getBlockType,
	getBlockTypes,
} from '../registration';

describe( 'blocks', () => {
	const error = console.error;
	const defaultBlockSettings = { save: noop, category: 'common' };

	// Reset block state before each test.
	beforeEach( () => {
		console.error = jest.fn();
	} );

	afterEach( () => {
		getBlockTypes().forEach( block => {
			unregisterBlockType( block.name );
		} );
		setUnknownTypeHandlerName( undefined );
		setDefaultBlockName( undefined );
		window._wpBlocksAttributes = {};
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

		it( 'should accept valid block names', () => {
			const block = registerBlockType( 'my-plugin/fancy-block-4', defaultBlockSettings );
			expect( console.error ).not.toHaveBeenCalled();
			expect( block ).toEqual( { name: 'my-plugin/fancy-block-4', save: noop, category: 'common' } );
		} );

		it( 'should prohibit registering the same block twice', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const block = registerBlockType( 'core/test-block', defaultBlockSettings );
			expect( console.error ).toHaveBeenCalledWith( 'Block "core/test-block" is already registered.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks without a save function', () => {
			const block = registerBlockType( 'my-plugin/fancy-block-5' );
			expect( console.error ).toHaveBeenCalledWith( 'The "save" property must be specified and must be a valid function.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with an invalid edit function', () => {
			const blockType = { save: noop, edit: 'not-a-function', category: 'common' },
				block = registerBlockType( 'my-plugin/fancy-block-6', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The "edit" property must be a valid function.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with more than 3 keywords', () => {
			const blockType = { save: noop, keywords: [ 'apple', 'orange', 'lemon', 'pineapple' ], category: 'common' },
				block = registerBlockType( 'my-plugin/fancy-block-7', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The block "my-plugin/fancy-block-7" can have a maximum of 3 keywords.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks without category', () => {
			const blockType = { settingName: 'settingValue', save: noop },
				block = registerBlockType( 'my-plugin/fancy-block-8', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The block "my-plugin/fancy-block-8" must have a category.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with non registered category.', () => {
			const blockType = { save: noop, category: 'custom-category-slug' },
				block = registerBlockType( 'my-plugin/fancy-block-9', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The block "my-plugin/fancy-block-9" must have a registered category.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should default to browser-initialized global attributes', () => {
			const attributes = { ok: { type: 'boolean' } };
			window._wpBlocksAttributes = {
				'core/test-block-with-attributes': attributes,
			};

			const blockType = { settingName: 'settingValue', save: noop, category: 'common' };
			registerBlockType( 'core/test-block-with-attributes', blockType );
			expect( getBlockType( 'core/test-block-with-attributes' ) ).toEqual( {
				name: 'core/test-block-with-attributes',
				settingName: 'settingValue',
				save: noop,
				category: 'common',
				attributes,
			} );
		} );

		it( 'should store a copy of block type', () => {
			const blockType = { settingName: 'settingValue', save: noop, category: 'common' };
			registerBlockType( 'core/test-block-with-settings', blockType );
			blockType.mutated = true;
			expect( getBlockType( 'core/test-block-with-settings' ) ).toEqual( {
				name: 'core/test-block-with-settings',
				settingName: 'settingValue',
				save: noop,
				category: 'common',
			} );
		} );
	} );

	describe( 'unregisterBlockType()', () => {
		it( 'should fail if a block is not registered', () => {
			const oldBlock = unregisterBlockType( 'core/test-block' );
			expect( console.error ).toHaveBeenCalledWith( 'Block "core/test-block" is not registered.' );
			expect( oldBlock ).toBeUndefined();
		} );

		it( 'should unregister existing blocks', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			expect( getBlockTypes() ).toEqual( [
				{ name: 'core/test-block', save: noop, category: 'common' },
			] );
			const oldBlock = unregisterBlockType( 'core/test-block' );
			expect( console.error ).not.toHaveBeenCalled();
			expect( oldBlock ).toEqual( { name: 'core/test-block', save: noop, category: 'common' } );
			expect( getBlockTypes() ).toEqual( [] );
		} );
	} );

	describe( 'setUnknownTypeHandlerName()', () => {
		it( 'assigns unknown type handler', () => {
			setUnknownTypeHandlerName( 'core/test-block' );

			expect( getUnknownTypeHandlerName() ).toBe( 'core/test-block' );
		} );
	} );

	describe( 'getUnknownTypeHandlerName()', () => {
		it( 'defaults to undefined', () => {
			expect( getUnknownTypeHandlerName() ).toBeUndefined();
		} );
	} );

	describe( 'setDefaultBlockName()', () => {
		it( 'assigns default block name', () => {
			setDefaultBlockName( 'core/test-block' );

			expect( getDefaultBlockName() ).toBe( 'core/test-block' );
		} );
	} );

	describe( 'getDefaultBlockName()', () => {
		it( 'defaults to undefined', () => {
			expect( getDefaultBlockName() ).toBeUndefined();
		} );
	} );

	describe( 'getBlockType()', () => {
		it( 'should return { name, save } for blocks with minimum settings', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			expect( getBlockType( 'core/test-block' ) ).toEqual( {
				name: 'core/test-block',
				save: noop,
				category: 'common',
			} );
		} );

		it( 'should return all block type elements', () => {
			const blockType = { settingName: 'settingValue', save: noop, category: 'common' };
			registerBlockType( 'core/test-block-with-settings', blockType );
			expect( getBlockType( 'core/test-block-with-settings' ) ).toEqual( {
				name: 'core/test-block-with-settings',
				settingName: 'settingValue',
				save: noop,
				category: 'common',
			} );
		} );
	} );

	describe( 'getBlockTypes()', () => {
		it( 'should return an empty array at first', () => {
			expect( getBlockTypes() ).toEqual( [] );
		} );

		it( 'should return all registered blocks', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const blockType = { settingName: 'settingValue', save: noop, category: 'common' };
			registerBlockType( 'core/test-block-with-settings', blockType );
			expect( getBlockTypes() ).toEqual( [
				{ name: 'core/test-block', save: noop, category: 'common' },
				{
					name: 'core/test-block-with-settings',
					settingName: 'settingValue',
					save: noop,
					category: 'common',
				},
			] );
		} );
	} );
} );
