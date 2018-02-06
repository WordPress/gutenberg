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
	hasBlockSupport,
	isReusableBlock,
} from '../registration';

describe( 'blocks', () => {
	const error = console.error;
	const defaultBlockSettings = { save: noop, category: 'common', title: 'block title' };

	beforeAll( () => {
		// Load all hooks that modify blocks
		require( 'blocks/hooks' );
	} );

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
		window._wpBlocks = {};
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
			expect( console.error ).toHaveBeenCalledWith( 'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with too many namespaces', () => {
			const block = registerBlockType( 'doing/it/wrong' );
			expect( console.error ).toHaveBeenCalledWith( 'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with invalid characters', () => {
			const block = registerBlockType( 'still/_doing_it_wrong' );
			expect( console.error ).toHaveBeenCalledWith( 'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with uppercase characters', () => {
			const block = registerBlockType( 'Core/Paragraph' );
			expect( console.error ).toHaveBeenCalledWith( 'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks not starting with a letter', () => {
			const block = registerBlockType( 'my-plugin/4-fancy-block', defaultBlockSettings );
			expect( console.error ).toHaveBeenCalledWith( 'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block' );
			expect( block ).toBeUndefined();
		} );

		it( 'should accept valid block names', () => {
			const block = registerBlockType( 'my-plugin/fancy-block-4', defaultBlockSettings );
			expect( console.error ).not.toHaveBeenCalled();
			expect( block ).toEqual( {
				name: 'my-plugin/fancy-block-4',
				icon: 'block-default',
				save: noop,
				category: 'common',
				title: 'block title',
				attributes: {
					className: {
						type: 'string',
					},
					layout: {
						type: 'string',
					},
				},
			} );
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
			const blockType = { save: noop, edit: 'not-a-function', category: 'common', title: 'block title' },
				block = registerBlockType( 'my-plugin/fancy-block-6', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The "edit" property must be a valid function.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with more than 3 keywords', () => {
			const blockType = { save: noop, keywords: [ 'apple', 'orange', 'lemon', 'pineapple' ], category: 'common', title: 'block title' },
				block = registerBlockType( 'my-plugin/fancy-block-7', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The block "my-plugin/fancy-block-7" can have a maximum of 3 keywords.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks without category', () => {
			const blockType = { settingName: 'settingValue', save: noop, title: 'block title' },
				block = registerBlockType( 'my-plugin/fancy-block-8', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The block "my-plugin/fancy-block-8" must have a category.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with non registered category.', () => {
			const blockType = { save: noop, category: 'custom-category-slug', title: 'block title' },
				block = registerBlockType( 'my-plugin/fancy-block-9', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The block "my-plugin/fancy-block-9" must have a registered category.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks without title', () => {
			const blockType = { settingName: 'settingValue', save: noop, category: 'common' },
				block = registerBlockType( 'my-plugin/fancy-block-9', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The block "my-plugin/fancy-block-9" must have a title.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with empty titles', () => {
			const blockType = { settingName: 'settingValue', save: noop, category: 'common', title: '' },
				block = registerBlockType( 'my-plugin/fancy-block-10', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'The block "my-plugin/fancy-block-10" must have a title.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should reject titles which are not strings', () => {
			const blockType = { settingName: 'settingValue', save: noop, category: 'common', title: 12345 },
				block = registerBlockType( 'my-plugin/fancy-block-11', blockType );
			expect( console.error ).toHaveBeenCalledWith( 'Block titles must be strings.' );
			expect( block ).toBeUndefined();
		} );

		it( 'should default to browser-initialized global attributes', () => {
			const attributes = { ok: { type: 'boolean' } };
			window._wpBlocks = {
				'core/test-block-with-attributes': { attributes },
			};

			const blockType = { settingName: 'settingValue', save: noop, category: 'common', title: 'block title' };
			registerBlockType( 'core/test-block-with-attributes', blockType );
			expect( getBlockType( 'core/test-block-with-attributes' ) ).toEqual( {
				name: 'core/test-block-with-attributes',
				settingName: 'settingValue',
				save: noop,
				category: 'common',
				title: 'block title',
				icon: 'block-default',
				attributes: {
					ok: {
						type: 'boolean',
					},
					className: {
						type: 'string',
					},
					layout: {
						type: 'string',
					},
				},
			} );
		} );

		it( 'should store a copy of block type', () => {
			const blockType = { settingName: 'settingValue', save: noop, category: 'common', title: 'block title' };
			registerBlockType( 'core/test-block-with-settings', blockType );
			blockType.mutated = true;
			expect( getBlockType( 'core/test-block-with-settings' ) ).toEqual( {
				name: 'core/test-block-with-settings',
				settingName: 'settingValue',
				save: noop,
				category: 'common',
				title: 'block title',
				icon: 'block-default',
				attributes: {
					className: {
						type: 'string',
					},
					layout: {
						type: 'string',
					},
				},
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
				{
					name: 'core/test-block',
					save: noop,
					category: 'common',
					title: 'block title',
					icon: 'block-default',
					attributes: {
						className: {
							type: 'string',
						},
						layout: {
							type: 'string',
						},
					},
				},
			] );
			const oldBlock = unregisterBlockType( 'core/test-block' );
			expect( console.error ).not.toHaveBeenCalled();
			expect( oldBlock ).toEqual( {
				name: 'core/test-block',
				save: noop,
				category: 'common',
				title: 'block title',
				icon: 'block-default',
				attributes: {
					className: {
						type: 'string',
					},
					layout: {
						type: 'string',
					},
				},
			} );
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
				title: 'block title',
				icon: 'block-default',
				attributes: {
					className: {
						type: 'string',
					},
					layout: {
						type: 'string',
					},
				},
			} );
		} );

		it( 'should return all block type elements', () => {
			const blockType = { settingName: 'settingValue', save: noop, category: 'common', title: 'block title' };
			registerBlockType( 'core/test-block-with-settings', blockType );
			expect( getBlockType( 'core/test-block-with-settings' ) ).toEqual( {
				name: 'core/test-block-with-settings',
				settingName: 'settingValue',
				save: noop,
				category: 'common',
				title: 'block title',
				icon: 'block-default',
				attributes: {
					className: {
						type: 'string',
					},
					layout: {
						type: 'string',
					},
				},
			} );
		} );
	} );

	describe( 'getBlockTypes()', () => {
		it( 'should return an empty array at first', () => {
			expect( getBlockTypes() ).toEqual( [] );
		} );

		it( 'should return all registered blocks', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const blockType = { settingName: 'settingValue', save: noop, category: 'common', title: 'block title' };
			registerBlockType( 'core/test-block-with-settings', blockType );
			expect( getBlockTypes() ).toEqual( [
				{
					name: 'core/test-block',
					save: noop,
					category: 'common',
					title: 'block title',
					icon: 'block-default',
					attributes: {
						className: {
							type: 'string',
						},
						layout: {
							type: 'string',
						},
					},
				},
				{
					name: 'core/test-block-with-settings',
					settingName: 'settingValue',
					save: noop,
					category: 'common',
					title: 'block title',
					icon: 'block-default',
					attributes: {
						className: {
							type: 'string',
						},
						layout: {
							type: 'string',
						},
					},
				},
			] );
		} );
	} );

	describe( 'hasBlockSupport', () => {
		it( 'should return false if block has no supports', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );

			expect( hasBlockSupport( 'core/test-block', 'foo' ) ).toBe( false );
		} );

		it( 'should return false if block does not define support by name', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				supports: {
					bar: true,
				},
			} );

			expect( hasBlockSupport( 'core/test-block', 'foo' ) ).toBe( false );
		} );

		it( 'should return custom default supports if block does not define support by name', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				supports: {
					bar: true,
				},
			} );

			expect( hasBlockSupport( 'core/test-block', 'foo', true ) ).toBe( true );
		} );

		it( 'should return true if block type supports', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				supports: {
					foo: true,
				},
			} );

			expect( hasBlockSupport( 'core/test-block', 'foo' ) ).toBe( true );
		} );

		it( 'should return true if block author defines unsupported but truthy value', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				supports: {
					foo: 'hmmm',
				},
			} );

			expect( hasBlockSupport( 'core/test-block', 'foo' ) ).toBe( true );
		} );

		it( 'should handle block settings object as argument to test', () => {
			const settings = {
				...defaultBlockSettings,
				supports: {
					foo: true,
				},
			};

			expect( hasBlockSupport( settings, 'foo' ) ).toBe( true );
		} );
	} );

	describe( 'isReusableBlock', () => {
		it( 'should return true for a reusable block', () => {
			const block = { name: 'core/block' };
			expect( isReusableBlock( block ) ).toBe( true );
		} );

		it( 'should return false for other blocks', () => {
			const block = { name: 'core/paragraph' };
			expect( isReusableBlock( block ) ).toBe( false );
		} );
	} );
} );
