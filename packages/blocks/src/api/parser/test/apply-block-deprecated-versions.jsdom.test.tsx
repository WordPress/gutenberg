import { afterEach, describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import type { Block, BlockSaveProps, RawBlock } from '../../../types';
import '../../../store';
import { applyBlockDeprecatedVersions } from '../apply-block-deprecated-versions';
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
		save: ( { attributes }: BlockSaveProps< { fruit?: string } > ) =>
			attributes.fruit || null,
		category: 'text',
		title: 'block title',
	};

	afterEach( () => {
		setFreeformContentHandlerName( '' );
		setUnregisteredTypeHandlerName( '' );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should return the original block if it has no deprecated versions', () => {
		const rawBlock: RawBlock = {
			blockName: 'core/test-block',
			attrs: {},
			innerHTML: '',
			innerContent: [],
			innerBlocks: [],
		};
		const block: Block = {
			clientId: '',
			name: 'core/test-block',
			attributes: {},
			innerBlocks: [],
			originalContent: '<span class="wp-block-test-block">Bananas</span>',
			isValid: false,
		};
		deepFreeze( block );
		const blockType = registerBlockType(
			'core/test-block',
			defaultBlockSettings
		);

		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType!
		);

		expect( migratedBlock ).toBe( block );
	} );

	it( 'should return the original block if no valid deprecated version found', () => {
		const rawBlock: RawBlock = {
			blockName: 'core/test-block',
			attrs: {},
			innerHTML: '',
			innerContent: [],
			innerBlocks: [],
		};
		const block: Block = {
			clientId: '',
			name: 'core/test-block',
			attributes: {},
			innerBlocks: [],
			originalContent: '<span class="wp-block-test-block">Bananas</span>',
			isValid: false,
		};
		deepFreeze( block );
		const blockType = registerBlockType( 'core/test-block', {
			...defaultBlockSettings,
			deprecated: [
				{
					attributes: {},
					save() {
						return 'nothing';
					},
				},
			],
		} );

		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType!
		);

		expect( migratedBlock ).toEqual( expect.objectContaining( block ) );
	} );

	it( 'should return with attributes parsed by the deprecated version', () => {
		const rawBlock: RawBlock = {
			blockName: 'core/test-block',
			attrs: {},
			innerHTML: '',
			innerContent: [],
			innerBlocks: [],
		};
		const block: Block = {
			clientId: '',
			name: 'core/test-block',
			attributes: {},
			innerBlocks: [],
			originalContent: '<span>Bananas</span>',
			isValid: false,
		};
		deepFreeze( block );
		const blockType = registerBlockType( 'core/test-block', {
			...defaultBlockSettings,
			save: ( { attributes }: BlockSaveProps< { fruit?: string } > ) => (
				<div>{ attributes.fruit }</div>
			),
			deprecated: [
				{
					attributes: {
						fruit: {
							type: 'string',
							source: 'text',
							selector: 'span',
						},
					},
					save: ( {
						attributes,
					}: BlockSaveProps< { fruit?: string } > ) => (
						<span>{ attributes.fruit }</span>
					),
				},
			],
		} );

		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType!
		);

		expect( migratedBlock.attributes ).toEqual( { fruit: 'Bananas' } );
	} );

	it( 'should be able to migrate attributes and innerBlocks', () => {
		const rawBlock: RawBlock = {
			blockName: 'core/test-block',
			attrs: {},
			innerHTML: '',
			innerContent: [],
			innerBlocks: [],
		};
		const block: Block = {
			clientId: '',
			name: 'core/test-block',
			attributes: {},
			innerBlocks: [],
			originalContent: '<span>Bananas</span>',
			isValid: false,
		};
		deepFreeze( block );
		const blockType = registerBlockType< Record< string, unknown > >(
			'core/test-block',
			{
				...defaultBlockSettings,
				save: ( {
					attributes,
				}: BlockSaveProps< { fruit?: string } > ) => (
					<div>{ attributes.fruit }</div>
				),
				deprecated: [
					{
						attributes: {
							fruit: {
								type: 'string',
								source: 'text',
								selector: 'span',
							},
						},
						save: ( {
							attributes,
						}: BlockSaveProps< { fruit?: string } > ) => (
							<span>{ attributes.fruit }</span>
						),
						migrate( attributes: { fruit?: string } ) {
							return [
								{ newFruit: attributes.fruit },
								[
									{
										clientId: '',
										name: 'core/test-block',
										isValid: true,
										attributes: { aaa: 'bbb' },
										innerBlocks: [],
									},
								],
							];
						},
					},
				],
			}
		);

		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType!
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
		const rawBlock: RawBlock = {
			blockName: 'core/test-block',
			attrs: { fruit: 'Bananas' },
			innerHTML: '',
			innerContent: [],
			innerBlocks: [],
		};
		const block: Block = {
			clientId: '',
			name: 'core/test-block',
			attributes: { fruit: 'Bananas' },
			innerBlocks: [],
			originalContent: 'Bananas',
			isValid: true,
		};
		deepFreeze( block );
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
			blockType!
		);

		expect( migratedBlock.attributes ).toEqual( { fruit: 'Bananas' } );
	} );

	it( 'should allow opt-in eligibility of valid block', () => {
		const rawBlock: RawBlock = {
			blockName: 'core/test-block',
			attrs: { fruit: 'Bananas' },
			innerHTML: '',
			innerContent: [],
			innerBlocks: [],
		};
		const block: Block = {
			clientId: '',
			name: 'core/test-block',
			attributes: { fruit: 'Bananas' },
			innerBlocks: [],
			originalContent: 'Bananas',
			isValid: true,
		};
		deepFreeze( block );
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
			blockType!
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
		const rawBlock: RawBlock = {
			blockName: 'core/test-block',
			attrs: {},
			innerHTML: '',
			innerContent: [],
			innerBlocks: [],
		};

		// When the block was created, it was given the new default value for the fruit attribute of 'Oranges'.
		// This is because unchanged default values are not saved to the comment delimiter attributes.
		// Validation failed because this block was saved when the old default was 'Bananas' as reflected by the originalContent.
		const block: Block = {
			clientId: '',
			name: 'core/test-block',
			attributes: { fruit: 'Oranges' },
			innerBlocks: [],
			originalContent: 'Bananas',
			isValid: false,
		};
		deepFreeze( block );

		// The migrated block successfully falls back to the old value of 'Bananas', allowing the block to
		// continue to be used.
		const migratedBlock = applyBlockDeprecatedVersions(
			block,
			rawBlock,
			blockType!
		);

		expect( migratedBlock.attributes ).toEqual( { fruit: 'Bananas' } );
	} );
} );
