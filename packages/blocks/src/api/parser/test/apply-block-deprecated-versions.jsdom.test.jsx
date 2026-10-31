import { afterEach, describe, expect, it, vi } from 'vitest';
import deepFreeze from 'deep-freeze';
import { addFilter, removeFilter } from '@wordpress/hooks';
import '../../../store';
import { applyBlockDeprecatedVersions } from '../apply-block-deprecated-versions';
import parse from '../';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
	setFreeformContentHandlerName,
	setUnregisteredTypeHandlerName,
} from '../../registration';

describe( 'applyBlockDeprecatedVersions', () => {
	const defaultBlockSettings = {
		apiVersion: 3,
		attributes: {
			fruit: {
				type: 'string',
			},
		},
		save: ( { attributes } ) => attributes.fruit || null,
		category: 'text',
		title: 'block title',
	};

	afterEach( () => {
		setFreeformContentHandlerName( undefined );
		setUnregisteredTypeHandlerName( undefined );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should return the original block if it has no deprecated versions', () => {
		const rawBlock = { attrs: {}, name: 'core/test-block' };
		const block = deepFreeze( {
			name: 'core/test-block',
			attributes: {},
			originalContent: '<span class="wp-block-test-block">Bananas</span>',
			isValid: false,
		} );
		const blockType = registerBlockType(
			'core/test-block',
			defaultBlockSettings
		);

		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType
		);

		expect( migratedBlock ).toBe( block );
	} );

	it( 'should return the original block if no valid deprecated version found', () => {
		const rawBlock = { attrs: {}, name: 'core/test-block' };
		const block = deepFreeze( {
			name: 'core/test-block',
			attributes: {},
			originalContent: '<span class="wp-block-test-block">Bananas</span>',
			isValid: false,
		} );
		const blockType = registerBlockType( 'core/test-block', {
			...defaultBlockSettings,
			deprecated: [
				{
					save() {
						return 'nothing';
					},
				},
			],
		} );

		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType
		);

		expect( migratedBlock ).toEqual( expect.objectContaining( block ) );
	} );

	it( 'should return with attributes parsed by the deprecated version', () => {
		const rawBlock = { attrs: {}, name: 'core/test-block' };
		const block = deepFreeze( {
			name: 'core/test-block',
			attributes: {},
			originalContent: '<span>Bananas</span>',
			isValid: false,
		} );
		const blockType = registerBlockType( 'core/test-block', {
			...defaultBlockSettings,
			save: ( props ) => <div>{ props.attributes.fruit }</div>,
			deprecated: [
				{
					attributes: {
						fruit: {
							type: 'string',
							source: 'text',
							selector: 'span',
						},
					},
					save: ( props ) => <span>{ props.attributes.fruit }</span>,
				},
			],
		} );

		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType
		);

		expect( migratedBlock.attributes ).toEqual( { fruit: 'Bananas' } );
	} );

	it( 'should be able to migrate attributes and innerBlocks', () => {
		const rawBlock = { attrs: {}, name: 'core/test-block' };
		const block = deepFreeze( {
			name: 'core/test-block',
			attributes: {},
			originalContent: '<span>Bananas</span>',
			isValid: false,
		} );
		const blockType = registerBlockType( 'core/test-block', {
			...defaultBlockSettings,
			save: ( props ) => <div>{ props.attributes.fruit }</div>,
			deprecated: [
				{
					attributes: {
						fruit: {
							type: 'string',
							source: 'text',
							selector: 'span',
						},
					},
					save: ( props ) => <span>{ props.attributes.fruit }</span>,
					migrate: ( attributes ) => {
						return [
							{ newFruit: attributes.fruit },
							[
								{
									name: 'core/test-block',
									attributes: { aaa: 'bbb' },
								},
							],
						];
					},
				},
			],
		} );

		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType
		);
		expect( migratedBlock.attributes ).toEqual( {
			newFruit: 'Bananas',
		} );
		expect( migratedBlock.innerBlocks ).toHaveLength( 1 );
		expect( migratedBlock.innerBlocks[ 0 ].name ).toEqual(
			'core/test-block'
		);
		expect( migratedBlock.innerBlocks[ 0 ].attributes ).toEqual( {
			aaa: 'bbb',
		} );
	} );

	it( 'should ignore valid uneligible blocks', () => {
		const rawBlock = { attrs: { fruit: 'Bananas' } };
		const block = deepFreeze( {
			name: 'core/test-block',
			attributes: { fruit: 'Bananas' },
			originalContent: 'Bananas',
			isValid: true,
		} );
		const blockType = registerBlockType( 'core/test-block', {
			...defaultBlockSettings,
			deprecated: [
				{
					attributes: defaultBlockSettings.attributes,
					save: defaultBlockSettings.save,
					migrate( attributes ) {
						return {
							fruit: attributes.fruit + '!',
						};
					},
				},
			],
		} );

		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType
		);

		expect( migratedBlock.attributes ).toEqual( { fruit: 'Bananas' } );
	} );

	it( 'should allow opt-in eligibility of valid block', () => {
		const rawBlock = {
			attrs: { fruit: 'Bananas' },
			name: 'core/test-block',
		};
		const block = deepFreeze( {
			name: 'core/test-block',
			attributes: { fruit: 'Bananas' },
			originalContent: 'Bananas',
			isValid: true,
		} );
		const blockType = registerBlockType( 'core/test-block', {
			...defaultBlockSettings,
			deprecated: [
				{
					attributes: defaultBlockSettings.attributes,
					save: defaultBlockSettings.save,
					isEligible: () => true,
					migrate( attributes ) {
						return {
							fruit: attributes.fruit + '!',
						};
					},
				},
			],
		} );

		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType
		);
		expect( migratedBlock.attributes ).toEqual( { fruit: 'Bananas!' } );
	} );

	it( 'allows a default attribute to be deprecated', () => {
		// The block's default fruit attribute has been changed from 'Bananas' to 'Oranges'.
		const blockType = registerBlockType( 'core/test-block', {
			...defaultBlockSettings,
			attributes: {
				fruit: {
					type: 'string',
					default: 'Oranges',
				},
			},
			deprecated: [
				{
					attributes: {
						fruit: {
							type: 'string',
							default: 'Bananas',
						},
					},
					save: defaultBlockSettings.save,
				},
			],
		} );

		// Because the fruits attribute is not sourced, when the block content was parsed no value for the
		// fruit attribute was found.
		const rawBlock = {
			attrs: {},
			name: 'core/test-block',
		};

		// When the block was created, it was given the new default value for the fruit attribute of 'Oranges'.
		// This is because unchanged default values are not saved to the comment delimiter attributes.
		// Validation failed because this block was saved when the old default was 'Bananas' as reflected by the originalContent.
		const block = deepFreeze( {
			name: 'core/test-block',
			attributes: { fruit: 'Oranges' },
			originalContent: 'Bananas',
			isValid: false,
		} );

		// The migrated block successfully falls back to the old value of 'Bananas', allowing the block to
		// continue to be used.
		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType
		);

		expect( migratedBlock.attributes ).toEqual( { fruit: 'Bananas' } );
	} );

	describe( 'currently registered comment attributes', () => {
		function parseDeprecatedBlock( attributes, deprecation = {} ) {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					fruit: { type: 'string', source: 'text', selector: 'div' },
					customString: { type: 'string' },
					customObject: { type: 'object' },
					customBoolean: { type: 'boolean' },
					customNumber: { type: 'number' },
					customChoice: {
						type: 'string',
						enum: [ 'allowed' ],
						default: 'allowed',
					},
					currentDefault: { type: 'string', default: 'New default' },
					currentSource: {
						type: 'string',
						source: 'text',
						selector: 'p',
					},
					localValue: { type: 'string', role: 'local' },
					renamedFruit: { type: 'string' },
				},
				save: ( { attributes: { fruit } } ) => <div>{ fruit }</div>,
				deprecated: [
					{
						attributes: {
							fruit: {
								type: 'string',
								source: 'text',
								selector: 'p',
							},
						},
						save: ( { attributes: { fruit } } ) => <p>{ fruit }</p>,
						...deprecation,
					},
				],
			} );

			return parse(
				`<!-- wp:test-block ${ JSON.stringify( attributes ) } --><p>Bananas</p><!-- /wp:test-block -->`,
				{ __unstableSkipMigrationLogs: true }
			)[ 0 ];
		}

		it( 'preserves explicit comment attributes that are absent from the historical schema', () => {
			const attributes = {
				customString: 'Custom value',
				customObject: { nested: [ false, 0, 'value' ] },
				customBoolean: false,
				customNumber: 0,
			};
			const block = parseDeprecatedBlock( attributes );

			expect( block.isValid ).toBe( true );
			expect( block.attributes ).toEqual( {
				fruit: 'Bananas',
				...attributes,
			} );
		} );

		it( 'preserves custom values without changing the historical migration input', () => {
			const migrate = vi.fn( ( { fruit } ) => ( { fruit } ) );
			const block = parseDeprecatedBlock(
				{ customString: 'Custom value' },
				{ migrate }
			);

			expect( migrate ).toHaveBeenCalledWith( { fruit: 'Bananas' }, [] );
			expect( block.attributes ).toEqual( {
				fruit: 'Bananas',
				customString: 'Custom value',
			} );
		} );

		it( 'lets the explicit migration output override a preserved value', () => {
			const block = parseDeprecatedBlock(
				{ customString: 'Custom value' },
				{
					migrate: ( { fruit } ) => ( {
						fruit,
						customString: undefined,
					} ),
				}
			);

			expect( block.attributes ).toEqual( {
				fruit: 'Bananas',
				customString: undefined,
			} );
		} );

		it( 'does not restore an attribute removed by its historical migration', () => {
			const block = parseDeprecatedBlock(
				{ customString: 'Old value' },
				{
					attributes: {
						fruit: {
							type: 'string',
							source: 'text',
							selector: 'p',
						},
						customString: { type: 'string' },
					},
					migrate: ( { fruit } ) => ( { fruit } ),
				}
			);

			expect( block.attributes ).toEqual( { fruit: 'Bananas' } );
		} );

		it( 'does not restore a historical attribute after it is renamed', () => {
			const block = parseDeprecatedBlock(
				{},
				{ migrate: ( { fruit } ) => ( { renamedFruit: fruit } ) }
			);

			expect( block.attributes ).toEqual( { renamedFruit: 'Bananas' } );
		} );

		it( 'does not restore an attribute supplied by a historical attribute filter', () => {
			addFilter(
				'blocks.getBlockAttributes',
				'test/historical-attributes',
				( attributes, blockType ) =>
					blockType.attributes.customString
						? attributes
						: { ...attributes, customString: 'Old filtered value' }
			);
			try {
				const block = parseDeprecatedBlock(
					{ customString: 'Custom value' },
					{ migrate: ( { fruit } ) => ( { fruit } ) }
				);

				expect( block.attributes ).toEqual( { fruit: 'Bananas' } );
			} finally {
				removeFilter(
					'blocks.getBlockAttributes',
					'test/historical-attributes'
				);
			}
		} );

		it( 'does not introduce current defaults, sourced values, or local attributes', () => {
			const migrate = vi.fn( ( attributes ) => attributes );
			const block = parseDeprecatedBlock(
				{
					currentSource: 'Injected value',
					localValue: 'Temporary value',
				},
				{ migrate }
			);

			expect( migrate ).toHaveBeenCalledWith( { fruit: 'Bananas' }, [] );
			expect( block.attributes ).toEqual( { fruit: 'Bananas' } );
		} );

		it.each( [
			[ 'unknown', 'value' ],
			[ 'customString', 0 ],
			[ 'customObject', 'value' ],
			[ 'customBoolean', 'false' ],
			[ 'customNumber', '0' ],
			[ 'customChoice', 'not allowed' ],
		] )(
			'does not preserve an unknown or invalid %s attribute',
			( name, value ) => {
				const block = parseDeprecatedBlock( { [ name ]: value } );

				expect( block.attributes ).toEqual( { fruit: 'Bananas' } );
			}
		);

		it.each( [ 'constructor', 'customString' ] )(
			'does not inherit the %s schema or raw delimiter value',
			( name ) => {
				const blockType = registerBlockType( 'core/test-block', {
					...defaultBlockSettings,
					attributes: {
						...defaultBlockSettings.attributes,
						customString: { type: 'string' },
					},
					deprecated: [
						{
							attributes: defaultBlockSettings.attributes,
							save: defaultBlockSettings.save,
						},
					],
				} );
				const attrs =
					name === 'constructor'
						? { fruit: 'Bananas', [ name ]: 'Extra value' }
						: Object.assign(
								Object.create( { [ name ]: 'Extra value' } ),
								{ fruit: 'Bananas' }
							);
				const block = deepFreeze( {
					name: 'core/test-block',
					attributes: { fruit: 'Bananas', [ name ]: 'Extra value' },
					originalContent: 'Bananas',
					innerBlocks: [],
					isValid: false,
				} );

				expect(
					applyBlockDeprecatedVersions( block, { attrs }, blockType )
						.attributes
				).toEqual( { fruit: 'Bananas' } );
			}
		);
	} );
} );
