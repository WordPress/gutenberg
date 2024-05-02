/* eslint-disable react/forbid-elements */

/**
 * WordPress dependencies
 */
import { addFilter, removeAllFilters, removeFilter } from '@wordpress/hooks';
import { logged } from '@wordpress/deprecated';
import { select, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	registerBlockType,
	registerBlockCollection,
	registerBlockVariation,
	unregisterBlockCollection,
	unregisterBlockType,
	setFreeformContentHandlerName,
	getFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
	getUnregisteredTypeHandlerName,
	setDefaultBlockName,
	getDefaultBlockName,
	getGroupingBlockName,
	setGroupingBlockName,
	getBlockType,
	getBlockTypes,
	getBlockSupport,
	getBlockVariations,
	hasBlockSupport,
	isReusableBlock,
	unstable__bootstrapServerSideBlockDefinitions, // eslint-disable-line camelcase
} from '../registration';
import { BLOCK_ICON_DEFAULT, DEPRECATED_ENTRY_KEYS } from '../constants';
import { omit } from '../utils';
import { store as blocksStore } from '../../store';
import { unlock } from '../../lock-unlock';

const noop = () => {};

const pick = ( obj, keys ) =>
	Object.fromEntries(
		Object.entries( obj ).filter( ( [ key ] ) => keys.includes( key ) )
	);

describe( 'blocks', () => {
	const defaultBlockSettings = {
		save: noop,
		category: 'text',
		title: 'block title',
	};

	afterEach( () => {
		const registeredNames = Object.keys(
			unlock( select( blocksStore ) ).getUnprocessedBlockTypes()
		);
		dispatch( blocksStore ).removeBlockTypes( registeredNames );
		setFreeformContentHandlerName( undefined );
		setUnregisteredTypeHandlerName( undefined );
		setDefaultBlockName( undefined );

		// Reset deprecation logging to ensure we properly track warnings.
		for ( const key in logged ) {
			delete logged[ key ];
		}
	} );

	describe( 'registerBlockType()', () => {
		it( 'should reject numbers', () => {
			const block = registerBlockType( 999 );
			expect( console ).toHaveErroredWith(
				'Block names must be strings.'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks without a namespace', () => {
			const block = registerBlockType( 'doing-it-wrong' );
			expect( console ).toHaveErroredWith(
				'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with too many namespaces', () => {
			const block = registerBlockType( 'doing/it/wrong' );
			expect( console ).toHaveErroredWith(
				'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with invalid characters', () => {
			const block = registerBlockType( 'still/_doing_it_wrong' );
			expect( console ).toHaveErroredWith(
				'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with uppercase characters', () => {
			const block = registerBlockType( 'Core/Paragraph' );
			expect( console ).toHaveErroredWith(
				'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks not starting with a letter', () => {
			const block = registerBlockType(
				'my-plugin/4-fancy-block',
				defaultBlockSettings
			);
			expect( console ).toHaveErroredWith(
				'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should accept valid block names', () => {
			const block = registerBlockType(
				'my-plugin/fancy-block-4',
				defaultBlockSettings
			);
			expect( console ).not.toHaveErrored();
			expect( block ).toEqual( {
				name: 'my-plugin/fancy-block-4',
				icon: { src: BLOCK_ICON_DEFAULT },
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {},
				save: noop,
				category: 'text',
				title: 'block title',
			} );
		} );

		it( 'should prohibit registering the same block twice', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const block = registerBlockType(
				'core/test-block',
				defaultBlockSettings
			);
			expect( console ).toHaveErroredWith(
				'Block "core/test-block" is already registered.'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with invalid save function', () => {
			const block = registerBlockType( 'my-plugin/fancy-block-5', {
				...defaultBlockSettings,
				attributes: {},
				keywords: [],
				save: 'invalid',
			} );
			expect( console ).toHaveErroredWith(
				'The "save" property must be a valid function.'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with an invalid edit function', () => {
			const blockType = {
					save: noop,
					edit: {},
					category: 'text',
					title: 'block title',
				},
				block = registerBlockType(
					'my-plugin/fancy-block-6',
					blockType
				);
			expect( console ).toHaveErroredWith(
				'The "edit" property must be a valid component.'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should canonicalize legacy block category.', () => {
			const blockType = {
					save: noop,
					category: 'common',
					title: 'block title',
				},
				block = registerBlockType(
					'my-plugin/fancy-block-9',
					blockType
				);
			expect( block.category ).toBe( 'text' );
		} );

		it( 'should unset category of blocks with non registered category.', () => {
			const blockType = {
					save: noop,
					category: 'custom-category-slug',
					title: 'block title',
				},
				block = registerBlockType(
					'my-plugin/fancy-block-9',
					blockType
				);
			expect( console ).toHaveWarnedWith(
				'The block "my-plugin/fancy-block-9" is registered with an invalid category "custom-category-slug".'
			);
			expect( block ).not.toBeUndefined();
			expect( block.category ).toBeUndefined();
		} );

		it( 'should reject blocks without title', () => {
			const blockType = {
					settingName: 'settingValue',
					save: noop,
					category: 'text',
				},
				block = registerBlockType(
					'my-plugin/fancy-block-9',
					blockType
				);
			expect( console ).toHaveErroredWith(
				'The block "my-plugin/fancy-block-9" must have a title.'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should reject blocks with empty titles', () => {
			const blockType = {
					settingName: 'settingValue',
					save: noop,
					category: 'text',
					title: '',
				},
				block = registerBlockType(
					'my-plugin/fancy-block-10',
					blockType
				);
			expect( console ).toHaveErroredWith(
				'The block "my-plugin/fancy-block-10" must have a title.'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should reject titles which are not strings', () => {
			const blockType = {
					settingName: 'settingValue',
					save: noop,
					category: 'text',
					title: 12345,
				},
				block = registerBlockType(
					'my-plugin/fancy-block-11',
					blockType
				);
			expect( console ).toHaveErroredWith(
				'Block titles must be strings.'
			);
			expect( block ).toBeUndefined();
		} );

		it( 'should assign default settings', () => {
			registerBlockType( 'core/test-block-with-defaults', {
				title: 'block title',
				category: 'text',
			} );

			expect( getBlockType( 'core/test-block-with-defaults' ) ).toEqual( {
				name: 'core/test-block-with-defaults',
				title: 'block title',
				category: 'text',
				icon: { src: BLOCK_ICON_DEFAULT },
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {},
				save: expect.any( Function ),
			} );
		} );

		it( 'should default to browser-initialized global attributes', () => {
			const attributes = { ok: { type: 'boolean' } };
			unstable__bootstrapServerSideBlockDefinitions( {
				'core/test-block-with-attributes': { attributes },
			} );

			const blockType = {
				settingName: 'settingValue',
				save: noop,
				category: 'text',
				title: 'block title',
			};
			registerBlockType( 'core/test-block-with-attributes', blockType );
			expect( getBlockType( 'core/test-block-with-attributes' ) ).toEqual(
				{
					name: 'core/test-block-with-attributes',
					settingName: 'settingValue',
					save: noop,
					category: 'text',
					title: 'block title',
					icon: { src: BLOCK_ICON_DEFAULT },
					attributes: {
						ok: {
							type: 'boolean',
						},
					},
					providesContext: {},
					usesContext: [],
					keywords: [],
					selectors: {},
					supports: {},
					styles: [],
					variations: [],
					blockHooks: {},
				}
			);
		} );

		it( 'should skip null values returned from the server', () => {
			const blockName = 'core/test-block-with-null-server-values';
			unstable__bootstrapServerSideBlockDefinitions( {
				[ blockName ]: {
					icon: null,
					category: null,
					parent: null,
					attributes: null,
					example: null,
				},
			} );

			const blockType = {
				title: 'block title',
			};
			registerBlockType( blockName, blockType );
			expect( getBlockType( blockName ) ).toEqual( {
				name: blockName,
				save: expect.any( Function ),
				title: 'block title',
				icon: { src: BLOCK_ICON_DEFAULT },
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {},
			} );
		} );

		it( 'should map incompatible keys returned from the server', () => {
			const blockName = 'core/test-block-with-incompatible-keys';
			unstable__bootstrapServerSideBlockDefinitions( {
				[ blockName ]: {
					api_version: 3,
					provides_context: {
						fontSize: 'fontSize',
					},
					uses_context: [ 'textColor' ],
					block_hooks: {
						'tests/my-block': 'after',
					},
				},
			} );

			const blockType = {
				title: 'block title',
			};
			registerBlockType( blockName, blockType );
			expect( getBlockType( blockName ) ).toEqual( {
				apiVersion: 3,
				name: blockName,
				save: expect.any( Function ),
				title: 'block title',
				icon: { src: BLOCK_ICON_DEFAULT },
				attributes: {},
				providesContext: {
					fontSize: 'fontSize',
				},
				usesContext: [ 'textColor' ],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {
					'tests/my-block': 'after',
				},
			} );
		} );

		it( 'should merge settings provided by server and client', () => {
			const blockName = 'core/test-block-with-merged-settings';
			unstable__bootstrapServerSideBlockDefinitions( {
				[ blockName ]: {
					variations: [
						{ name: 'foo', label: 'Foo' },
						{ name: 'baz', label: 'Baz', description: 'Testing' },
					],
				},
			} );

			const blockType = {
				title: 'block settings merge',
				variations: [
					{ name: 'bar', label: 'Bar' },
					{ name: 'baz', label: 'Baz', icon: 'layout' },
				],
			};
			registerBlockType( blockName, blockType );
			expect( getBlockType( blockName ) ).toEqual( {
				name: blockName,
				save: expect.any( Function ),
				title: 'block settings merge',
				icon: { src: BLOCK_ICON_DEFAULT },
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [
					{ name: 'foo', label: 'Foo' },
					{
						description: 'Testing',
						name: 'baz',
						label: 'Baz',
						icon: 'layout',
					},
					{ name: 'bar', label: 'Bar' },
				],
				blockHooks: {},
			} );
		} );

		// This test can be removed once the polyfill for blockHooks gets removed.
		it( 'should polyfill blockHooks using metadata on the client when not set on the server', () => {
			const blockName = 'tests/hooked-block';
			unstable__bootstrapServerSideBlockDefinitions( {
				[ blockName ]: {
					category: 'widgets',
				},
			} );

			const blockType = {
				title: 'block title',
			};
			registerBlockType(
				{
					name: blockName,
					blockHooks: {
						'tests/block': 'firstChild',
					},
					category: 'ignored',
				},
				blockType
			);
			expect( getBlockType( blockName ) ).toEqual( {
				name: blockName,
				save: expect.any( Function ),
				title: 'block title',
				category: 'widgets',
				icon: { src: BLOCK_ICON_DEFAULT },
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {
					'tests/block': 'firstChild',
				},
			} );
		} );

		it( 'should validate the icon', () => {
			const blockType = {
				save: noop,
				category: 'text',
				title: 'block title',
				icon: { chicken: 'ribs' },
			};
			const block = registerBlockType(
				'core/test-block-icon-normalize-element',
				blockType
			);
			expect( console ).toHaveErrored();
			expect( block ).toBeUndefined();
		} );

		it( 'should normalize the icon containing an element', () => {
			const blockType = {
				save: noop,
				category: 'text',
				title: 'block title',
				icon: (
					<svg width="20" height="20" viewBox="0 0 20 20">
						<circle
							cx="10"
							cy="10"
							r="10"
							fill="red"
							stroke="blue"
							strokeWidth="10"
						/>
					</svg>
				),
			};
			registerBlockType(
				'core/test-block-icon-normalize-element',
				blockType
			);
			expect(
				getBlockType( 'core/test-block-icon-normalize-element' )
			).toEqual( {
				name: 'core/test-block-icon-normalize-element',
				save: noop,
				category: 'text',
				title: 'block title',
				icon: {
					src: (
						<svg width="20" height="20" viewBox="0 0 20 20">
							<circle
								cx="10"
								cy="10"
								r="10"
								fill="red"
								stroke="blue"
								strokeWidth="10"
							/>
						</svg>
					),
				},
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {},
			} );
		} );

		it( 'should normalize the icon containing a string', () => {
			const blockType = {
				save: noop,
				category: 'text',
				title: 'block title',
				icon: 'foo',
			};
			registerBlockType(
				'core/test-block-icon-normalize-string',
				blockType
			);
			expect(
				getBlockType( 'core/test-block-icon-normalize-string' )
			).toEqual( {
				name: 'core/test-block-icon-normalize-string',
				save: noop,
				category: 'text',
				title: 'block title',
				icon: {
					src: 'foo',
				},
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {},
			} );
		} );

		it( 'should normalize the icon containing a function', () => {
			const MyTestIcon = () => {
				return (
					<svg width="20" height="20" viewBox="0 0 20 20">
						<circle
							cx="10"
							cy="10"
							r="10"
							fill="red"
							stroke="blue"
							strokeWidth="10"
						/>
					</svg>
				);
			};
			const blockType = {
				save: noop,
				category: 'text',
				title: 'block title',
				icon: MyTestIcon,
			};
			registerBlockType(
				'core/test-block-icon-normalize-function',
				blockType
			);
			expect(
				getBlockType( 'core/test-block-icon-normalize-function' )
			).toEqual( {
				name: 'core/test-block-icon-normalize-function',
				save: noop,
				category: 'text',
				title: 'block title',
				icon: {
					src: MyTestIcon,
				},
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {},
			} );
		} );

		it( 'should correctly register an icon with background and a custom svg', () => {
			const blockType = {
				save: noop,
				category: 'text',
				title: 'block title',
				icon: {
					background: '#f00',
					src: (
						<svg width="20" height="20" viewBox="0 0 20 20">
							<circle
								cx="10"
								cy="10"
								r="10"
								fill="red"
								stroke="blue"
								strokeWidth="10"
							/>
						</svg>
					),
				},
			};
			registerBlockType(
				'core/test-block-icon-normalize-background',
				blockType
			);
			expect(
				getBlockType( 'core/test-block-icon-normalize-background' )
			).toEqual( {
				name: 'core/test-block-icon-normalize-background',
				save: noop,
				category: 'text',
				title: 'block title',
				icon: {
					background: '#f00',
					foreground: '#191e23',
					shadowColor: 'rgba(255, 0, 0, 0.3)',
					src: (
						<svg width="20" height="20" viewBox="0 0 20 20">
							<circle
								cx="10"
								cy="10"
								r="10"
								fill="red"
								stroke="blue"
								strokeWidth="10"
							/>
						</svg>
					),
				},
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {},
			} );
		} );

		it( 'should store a copy of block type', () => {
			const blockType = {
				settingName: 'settingValue',
				save: noop,
				category: 'text',
				title: 'block title',
			};
			registerBlockType( 'core/test-block-with-settings', blockType );
			blockType.mutated = true;
			expect( getBlockType( 'core/test-block-with-settings' ) ).toEqual( {
				name: 'core/test-block-with-settings',
				settingName: 'settingValue',
				save: noop,
				category: 'text',
				title: 'block title',
				icon: { src: BLOCK_ICON_DEFAULT },
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {},
			} );
		} );

		describe( 'applyFilters', () => {
			afterEach( () => {
				removeAllFilters( 'blocks.registerBlockType' );
			} );

			it( 'should reject valid blocks when they become invalid after executing filter', () => {
				addFilter(
					'blocks.registerBlockType',
					'core/blocks/without-title',
					( settings ) => {
						return {
							...settings,
							title: '',
						};
					}
				);
				const block = registerBlockType(
					'my-plugin/fancy-block-12',
					defaultBlockSettings
				);
				expect( console ).toHaveErroredWith(
					'The block "my-plugin/fancy-block-12" must have a title.'
				);
				expect( block ).toBeUndefined();
			} );

			it( 'should reject blocks which become invalid after executing filter which does not return a plain object', () => {
				addFilter(
					'blocks.registerBlockType',
					'core/blocks/without-save',
					( settings ) => {
						return [ settings ];
					}
				);
				const block = registerBlockType(
					'my-plugin/fancy-block-13',
					defaultBlockSettings
				);
				expect( console ).toHaveErroredWith(
					'Block settings must be a valid object.'
				);
				expect( block ).toBeUndefined();
			} );

			it( 'should apply the blocks.registerBlockType filter to each of the deprecated settings as well as the main block settings', () => {
				const name = 'my-plugin/fancy-block-13';
				const blockSettingsWithDeprecations = {
					...defaultBlockSettings,
					deprecated: [
						{
							save() {
								return 1;
							},
						},
						{
							save() {
								return 2;
							},
						},
					],
				};

				let i = 0;
				addFilter(
					'blocks.registerBlockType',
					'core/blocks/without-title',
					( settings ) => {
						// Verify that for deprecations, the filter is called with a merge of pre-filter
						// settings with deprecation keys omitted and the deprecation entry.
						if ( i > 0 ) {
							// eslint-disable-next-line jest/no-conditional-expect
							expect( settings ).toEqual( {
								...omit(
									{
										name,
										icon: BLOCK_ICON_DEFAULT,
										attributes: {},
										providesContext: {},
										usesContext: [],
										keywords: [],
										selectors: {},
										supports: {},
										styles: [],
										variations: [],
										blockHooks: {},
										save: () => null,
										...blockSettingsWithDeprecations,
									},
									DEPRECATED_ENTRY_KEYS
								),
								...blockSettingsWithDeprecations.deprecated[
									i - 1
								],
							} );
						}
						i++;

						return {
							...settings,
							attributes: {
								...settings.attributes,
								id: {
									type: 'string',
								},
							},
						};
					}
				);

				const block = registerBlockType(
					name,
					blockSettingsWithDeprecations
				);

				expect( block.attributes.id ).toEqual( { type: 'string' } );
				block.deprecated.forEach( ( deprecation ) => {
					expect( deprecation.attributes.id ).toEqual( {
						type: 'string',
					} );
					// Verify that the deprecation's keys are a subset of deprecation keys.
					expect( deprecation ).toEqual(
						pick( deprecation, DEPRECATED_ENTRY_KEYS )
					);
				} );
			} );

			it( 'should update block attributes separately for each block when they use a default set', () => {
				addFilter(
					'blocks.registerBlockType',
					'core/blocks/shared-defaults',
					( settings, name ) => {
						if ( name === 'my-plugin/test-block-1' ) {
							settings.attributes.newlyAddedAttribute = {
								type: String,
							};
						}
						return settings;
					}
				);
				const block1 = registerBlockType(
					'my-plugin/test-block-1',
					defaultBlockSettings
				);
				const block2 = registerBlockType(
					'my-plugin/test-block-2',
					defaultBlockSettings
				);
				// Only attributes of block1 are supposed to be edited by the filter thus it must differ from block2.
				expect( block1.attributes ).not.toEqual( block2.attributes );
			} );

			it( 'should allow non-string descriptions at registration but warn for undesired usage.', () => {
				const newDescription = <p>foo bar</p>;

				const block = registerBlockType( 'my-plugin/test-block-1', {
					...defaultBlockSettings,
					description: newDescription,
				} );

				expect( block.description ).toBe( newDescription );
				expect( console ).toHaveWarnedWith(
					'Declaring non-string block descriptions is deprecated since version 6.2.'
				);
			} );

			it( 'should allow non-string descriptions through `blocks.registerBlockType` filter but warn for undesired usage.', () => {
				const newDescription = <p>foo bar</p>;
				addFilter(
					'blocks.registerBlockType',
					'core/blocks/non-string-description',
					( settings ) => {
						settings.description = newDescription;
						return settings;
					}
				);
				const block = registerBlockType(
					'my-plugin/test-block-2',
					defaultBlockSettings
				);

				expect( block.description ).toBe( newDescription );
				expect( console ).toHaveWarnedWith(
					'Declaring non-string block descriptions is deprecated since version 6.2.'
				);
			} );

			it( 're-applies block filters', () => {
				// register block
				registerBlockType( 'test/block', defaultBlockSettings );

				// register a filter after registering a block
				addFilter(
					'blocks.registerBlockType',
					'core/blocks/reapply',
					( settings ) => ( {
						...settings,
						title: settings.title + ' filtered',
					} )
				);

				// check that block type has unfiltered values
				expect( getBlockType( 'test/block' ).title ).toBe(
					'block title'
				);

				// reapply the block filters
				dispatch( blocksStore ).reapplyBlockTypeFilters();

				// check that block type has filtered values
				expect( getBlockType( 'test/block' ).title ).toBe(
					'block title filtered'
				);
			} );
		} );

		test( 'registers block from metadata', () => {
			const Edit = () => 'test';
			const block = registerBlockType(
				{
					name: 'test/block-from-metadata',
					title: 'Block from metadata',
					category: 'text',
					icon: 'palmtree',
					variations: [
						{
							name: 'variation',
							title: 'Variation Title',
							description: 'Variation description',
							keywords: [ 'variation' ],
						},
					],
				},
				{
					edit: Edit,
					save: noop,
				}
			);
			expect( block ).toEqual( {
				name: 'test/block-from-metadata',
				title: 'Block from metadata',
				category: 'text',
				icon: {
					src: 'palmtree',
				},
				keywords: [],
				attributes: {},
				providesContext: {},
				usesContext: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [
					{
						name: 'variation',
						title: 'Variation Title',
						description: 'Variation description',
						keywords: [ 'variation' ],
					},
				],
				blockHooks: {},
				edit: Edit,
				save: noop,
			} );
		} );
		test( 'registers block from metadata with translation', () => {
			addFilter(
				'i18n.gettext_with_context_test',
				'test/mark-as-translated',
				( value ) => value + ' (translated)'
			);

			const Edit = () => 'test';
			const block = registerBlockType(
				{
					name: 'test/block-from-metadata-i18n',
					title: 'I18n title from metadata',
					description: 'I18n description from metadata',
					keywords: [ 'i18n', 'metadata' ],
					styles: [
						{
							name: 'i18n-style',
							label: 'I18n Style Label',
						},
					],
					variations: [
						{
							name: 'i18n-variation',
							title: 'I18n Variation Title',
							description: 'I18n variation description',
							keywords: [ 'variation' ],
						},
					],
					textdomain: 'test',
					icon: 'palmtree',
				},
				{
					edit: Edit,
					save: noop,
				}
			);
			removeFilter(
				'i18n.gettext_with_context_test',
				'test/mark-as-translated'
			);

			expect( block ).toEqual( {
				name: 'test/block-from-metadata-i18n',
				title: 'I18n title from metadata (translated)',
				description: 'I18n description from metadata (translated)',
				icon: {
					src: 'palmtree',
				},
				keywords: [ 'i18n (translated)', 'metadata (translated)' ],
				attributes: {},
				providesContext: {},
				usesContext: [],
				selectors: {},
				supports: {},
				styles: [
					{
						name: 'i18n-style',
						label: 'I18n Style Label (translated)',
					},
				],
				variations: [
					{
						name: 'i18n-variation',
						title: 'I18n Variation Title (translated)',
						description: 'I18n variation description (translated)',
						keywords: [ 'variation (translated)' ],
					},
				],
				blockHooks: {},
				edit: Edit,
				save: noop,
			} );
		} );
	} );

	describe( 'registerBlockCollection()', () => {
		it( 'creates a new block collection', () => {
			registerBlockCollection( 'core', { title: 'Core' } );

			expect( select( blocksStore ).getCollections() ).toEqual( {
				core: { title: 'Core', icon: undefined },
			} );
		} );
	} );

	describe( 'unregisterBlockCollection()', () => {
		it( 'removes a  block collection', () => {
			registerBlockCollection( 'core', { title: 'Core' } );
			registerBlockCollection( 'core2', { title: 'Core2' } );
			unregisterBlockCollection( 'core' );

			expect( select( blocksStore ).getCollections() ).toEqual( {
				core2: { title: 'Core2', icon: undefined },
			} );
		} );
	} );

	describe( 'unregisterBlockType()', () => {
		it( 'should fail if a block is not registered', () => {
			const oldBlock = unregisterBlockType( 'core/test-block' );
			expect( console ).toHaveErroredWith(
				'Block "core/test-block" is not registered.'
			);
			expect( oldBlock ).toBeUndefined();
		} );

		it( 'should unregister existing blocks', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			expect( getBlockTypes() ).toEqual( [
				{
					name: 'core/test-block',
					save: noop,
					category: 'text',
					title: 'block title',
					icon: { src: BLOCK_ICON_DEFAULT },
					attributes: {},
					providesContext: {},
					usesContext: [],
					keywords: [],
					selectors: {},
					supports: {},
					styles: [],
					variations: [],
					blockHooks: {},
				},
			] );
			const oldBlock = unregisterBlockType( 'core/test-block' );
			expect( console ).not.toHaveErrored();
			expect( oldBlock ).toEqual( {
				name: 'core/test-block',
				save: noop,
				category: 'text',
				title: 'block title',
				icon: { src: BLOCK_ICON_DEFAULT },
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {},
			} );
			expect( getBlockTypes() ).toEqual( [] );
		} );
	} );

	describe( 'setFreeformContentHandlerName()', () => {
		it( 'assigns unknown type handler', () => {
			setFreeformContentHandlerName( 'core/test-block' );

			expect( getFreeformContentHandlerName() ).toBe( 'core/test-block' );
		} );
	} );

	describe( 'getFreeformContentHandlerName()', () => {
		it( 'defaults to undefined', () => {
			expect( getFreeformContentHandlerName() ).toBeNull();
		} );
	} );

	describe( 'setUnregisteredTypeHandlerName()', () => {
		it( 'assigns unknown type handler', () => {
			setUnregisteredTypeHandlerName( 'core/test-block' );

			expect( getUnregisteredTypeHandlerName() ).toBe(
				'core/test-block'
			);
		} );
	} );

	describe( 'getUnregisteredTypeHandlerName()', () => {
		it( 'defaults to undefined', () => {
			expect( getUnregisteredTypeHandlerName() ).toBeNull();
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
			expect( getDefaultBlockName() ).toBeNull();
		} );
	} );

	describe( 'getGroupingBlockName()', () => {
		it( 'defaults to undefined', () => {
			expect( getGroupingBlockName() ).toBeNull();
		} );
	} );

	describe( 'setGroupingBlockName()', () => {
		it( 'assigns default block name', () => {
			setGroupingBlockName( 'core/test-block' );

			expect( getGroupingBlockName() ).toBe( 'core/test-block' );
		} );
	} );

	describe( 'getBlockType()', () => {
		it( 'should return { name, save } for blocks with minimum settings', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			expect( getBlockType( 'core/test-block' ) ).toEqual( {
				name: 'core/test-block',
				save: noop,
				category: 'text',
				title: 'block title',
				icon: { src: BLOCK_ICON_DEFAULT },
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {},
			} );
		} );

		it( 'should return all block type elements', () => {
			const blockType = {
				settingName: 'settingValue',
				save: noop,
				category: 'text',
				title: 'block title',
			};
			registerBlockType( 'core/test-block-with-settings', blockType );
			expect( getBlockType( 'core/test-block-with-settings' ) ).toEqual( {
				name: 'core/test-block-with-settings',
				settingName: 'settingValue',
				save: noop,
				category: 'text',
				title: 'block title',
				icon: { src: BLOCK_ICON_DEFAULT },
				attributes: {},
				providesContext: {},
				usesContext: [],
				keywords: [],
				selectors: {},
				supports: {},
				styles: [],
				variations: [],
				blockHooks: {},
			} );
		} );
	} );

	describe( 'getBlockTypes()', () => {
		it( 'should return an empty array at first', () => {
			expect( getBlockTypes() ).toEqual( [] );
		} );

		it( 'should return all registered blocks', () => {
			registerBlockType( 'core/test-block', defaultBlockSettings );
			const blockType = {
				settingName: 'settingValue',
				save: noop,
				category: 'text',
				title: 'block title',
			};
			registerBlockType( 'core/test-block-with-settings', blockType );
			expect( getBlockTypes() ).toEqual( [
				{
					name: 'core/test-block',
					save: noop,
					category: 'text',
					title: 'block title',
					icon: { src: BLOCK_ICON_DEFAULT },
					attributes: {},
					providesContext: {},
					usesContext: [],
					keywords: [],
					selectors: {},
					supports: {},
					styles: [],
					variations: [],
					blockHooks: {},
				},
				{
					name: 'core/test-block-with-settings',
					settingName: 'settingValue',
					save: noop,
					category: 'text',
					title: 'block title',
					icon: { src: BLOCK_ICON_DEFAULT },
					attributes: {},
					providesContext: {},
					usesContext: [],
					keywords: [],
					selectors: {},
					supports: {},
					styles: [],
					variations: [],
					blockHooks: {},
				},
			] );
		} );
	} );

	describe( 'getBlockSupport', () => {
		it( 'should return undefined if block has no supports', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				supports: {
					bar: true,
				},
			} );

			expect( getBlockSupport( 'core/test-block', 'foo' ) ).toBe(
				undefined
			);
		} );

		it( 'should return block supports value', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				supports: {
					bar: true,
				},
			} );

			expect( getBlockSupport( 'core/test-block', 'bar' ) ).toBe( true );
		} );

		it( 'should return custom default supports if block does not define support by name', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				supports: {
					bar: true,
				},
			} );

			expect( getBlockSupport( 'core/test-block', 'foo', true ) ).toBe(
				true
			);
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

			expect( hasBlockSupport( 'core/test-block', 'foo', true ) ).toBe(
				true
			);
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

	describe( 'registerBlockVariation', () => {
		it( 'should warn when registering block variation without a name', () => {
			registerBlockType( 'core/variation-block', defaultBlockSettings );
			registerBlockVariation( 'core/variation-block', {
				title: 'Variation Title',
				description: 'Variation description',
			} );

			expect( console ).toHaveWarnedWith(
				'Variation names must be unique strings.'
			);
			expect( getBlockVariations( 'core/variation-block' ) ).toEqual( [
				{
					title: 'Variation Title',
					description: 'Variation description',
				},
			] );
		} );
	} );
} );

/* eslint-enable react/forbid-elements */
