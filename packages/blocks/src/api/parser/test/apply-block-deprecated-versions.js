/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
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
		attributes: {
			fruit: {
				type: 'string',
			},
		},
		save: ( { attributes } ) => attributes.fruit || null,
		category: 'text',
		title: 'block title',
	};

	beforeAll( () => {
		// Initialize the block store.
		require( '../../../store' );
	} );

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
		// This is because unchanged default values are not saved to the comment delimeter attributes.
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
} );
