import { afterEach, describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import '../../../store';
import { applyBlockDeprecatedVersions } from '../apply-block-deprecated-versions';
import { parseRawBlock } from '../index';
import serialize from '../../serializer';
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
		// Should not log Level 3 regeneration during deprecation validation
		expect( console ).not.toHaveLogged();
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

	describe( 'attribute-only deprecations (no `save`)', () => {
		const rawBlock = {
			attrs: { fruit: 'Bananas', size: 10 },
			name: 'core/test-block',
		};
		// Old content stored `size` as a number; the current block type
		// stores it as a string with a unit.
		const attributeOnlyDeprecation = {
			attributes: {
				...defaultBlockSettings.attributes,
				size: { type: 'number' },
			},
			isEligible: ( attributes ) => typeof attributes.size === 'number',
			migrate: ( { size, ...attributes } ) => ( {
				...attributes,
				size: `${ size }px`,
			} ),
		};
		const registerWithAttributeOnly = ( extra = {} ) =>
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					...defaultBlockSettings.attributes,
					size: { type: 'string' },
				},
				deprecated: [ attributeOnlyDeprecation ],
				...extra,
			} );
		const blockAtLevel = ( validationLevel, isValid ) =>
			deepFreeze( {
				name: 'core/test-block',
				// The current schema dropped the numeric `size`.
				attributes: { fruit: 'Bananas' },
				originalContent: 'Bananas',
				isValid,
				validationLevel,
			} );

		it.each( [
			[ 'valid', 0, true ],
			[ 'reconstructed', 2, false ],
			[ 'regenerated', 3, false ],
		] )(
			'should apply to a %s block when eligible',
			( _label, validationLevel, isValid ) => {
				const blockType = registerWithAttributeOnly();

				const migratedBlock = applyBlockDeprecatedVersions(
					blockAtLevel( validationLevel, isValid ),
					rawBlock,
					blockType
				);

				expect( migratedBlock.isValid ).toBe( true );
				expect( migratedBlock.validationLevel ).toBe( 1 );
				expect( migratedBlock.attributes ).toEqual( {
					fruit: 'Bananas',
					size: '10px',
				} );
			}
		);

		it( 'should apply to an invalid block when the migrated attributes preserve its content', () => {
			// `text` moved from the markup to the delimiter: parsed through the
			// current block type, old content loses its text and is invalid.
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: { text: { type: 'string' } },
				save: ( { attributes } ) => <p>{ attributes.text }</p>,
				deprecated: [
					{
						attributes: {
							text: {
								type: 'string',
								source: 'html',
								selector: 'p',
							},
						},
						isEligible: ( attributes ) =>
							attributes.text === undefined,
					},
				],
			} );

			const parsedBlock = parseRawBlock(
				{
					blockName: 'core/test-block',
					attrs: {},
					innerHTML: '<p>Hello</p>',
					innerBlocks: [],
					innerContent: [ '<p>Hello</p>' ],
				},
				{ __unstableSkipMigrationLogs: true }
			);

			expect( parsedBlock.isValid ).toBe( true );
			expect( parsedBlock.validationLevel ).toBe( 1 );
			expect( parsedBlock.attributes ).toEqual( { text: 'Hello' } );
		} );

		it( 'should not apply when the migrated attributes do not preserve the content', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: { text: { type: 'string' } },
				save: ( { attributes } ) => <p>{ attributes.text }</p>,
				deprecated: [
					{
						// Opts in, but sources nothing the current block type
						// does not: the result would still lose the text.
						attributes: { text: { type: 'string' } },
						isEligible: () => true,
						migrate: ( attributes ) => ( {
							...attributes,
							text: 'Replaced',
						} ),
					},
				],
			} );

			const parsedBlock = parseRawBlock(
				{
					blockName: 'core/test-block',
					attrs: {},
					innerHTML: '<p>Hello</p>',
					innerBlocks: [],
					innerContent: [ '<p>Hello</p>' ],
				},
				{ __unstableSkipMigrationLogs: true }
			);

			expect( parsedBlock.isValid ).toBe( false );
			expect( parsedBlock.validationLevel ).toBe( 4 );
			expect( parsedBlock.attributes ).toEqual( {} );
			// The block stays invalid, which the parser reports as usual.
			expect( console ).toHaveWarned();
			expect( console ).toHaveErrored();
		} );

		it( 'should not apply when `isEligible` declines or is missing', () => {
			const declining = registerWithAttributeOnly( {
				deprecated: [
					{ ...attributeOnlyDeprecation, isEligible: () => false },
				],
			} );
			expect(
				applyBlockDeprecatedVersions(
					blockAtLevel( 2, false ),
					rawBlock,
					declining
				).attributes
			).toEqual( { fruit: 'Bananas' } );
			unregisterBlockType( 'core/test-block' );

			const { isEligible, ...withoutIsEligible } =
				attributeOnlyDeprecation;
			const missing = registerWithAttributeOnly( {
				deprecated: [ withoutIsEligible ],
			} );
			expect(
				applyBlockDeprecatedVersions(
					blockAtLevel( 0, true ),
					rawBlock,
					missing
				).attributes
			).toEqual( { fruit: 'Bananas' } );
		} );

		it( 'should chain after a deprecation matched by markup', () => {
			const blockType = registerWithAttributeOnly( {
				deprecated: [
					{
						attributes: {
							...defaultBlockSettings.attributes,
							size: { type: 'number' },
						},
						save: ( { attributes } ) => (
							<div>{ attributes.fruit }</div>
						),
					},
					attributeOnlyDeprecation,
				],
			} );
			const block = deepFreeze( {
				name: 'core/test-block',
				attributes: { fruit: 'Bananas' },
				originalContent: '<div>Bananas</div>',
				isValid: false,
				validationLevel: 4,
			} );

			const migratedBlock = applyBlockDeprecatedVersions(
				block,
				rawBlock,
				blockType
			);

			expect( migratedBlock.validationLevel ).toBe( 1 );
			expect( migratedBlock.attributes ).toEqual( {
				fruit: 'Bananas',
				size: '10px',
			} );
		} );

		it( 'should migrate a regenerated block when parsing', () => {
			registerBlockType( 'core/test-block', {
				...defaultBlockSettings,
				attributes: {
					content: { type: 'string', source: 'html', selector: 'p' },
					size: { type: 'string' },
				},
				save: ( { attributes } ) => (
					<p className="wp-block-test">{ attributes.content }</p>
				),
				deprecated: [
					{
						attributes: {
							content: {
								type: 'string',
								source: 'html',
								selector: 'p',
							},
							size: { type: 'number' },
						},
						isEligible: ( attributes ) =>
							typeof attributes.size === 'number',
						migrate: ( { size, ...attributes } ) => ( {
							...attributes,
							size: `${ size }px`,
						} ),
					},
				],
			} );

			// The markup lacks the generated class (Level 2) and the
			// delimiter carries the old numeric size.
			const parsedBlock = parseRawBlock(
				{
					blockName: 'core/test-block',
					attrs: { size: 10 },
					innerHTML: '<p>Text</p>',
					innerBlocks: [],
					innerContent: [ '<p>Text</p>' ],
				},
				{ __unstableSkipMigrationLogs: true }
			);

			expect( parsedBlock.isValid ).toBe( true );
			expect( parsedBlock.validationLevel ).toBe( 1 );
			expect( parsedBlock.attributes ).toEqual( {
				content: 'Text',
				size: '10px',
			} );
			expect( serialize( [ parsedBlock ] ) ).toBe(
				'<!-- wp:test-block {"size":"10px"} -->\n<p class="wp-block-test">Text</p>\n<!-- /wp:test-block -->'
			);
		} );
	} );
} );
