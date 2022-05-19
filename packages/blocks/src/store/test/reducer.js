/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	addBlockVariations,
	addBlockTypes,
	removeBlockVariations,
} from '../actions';
import {
	unprocessedBlockTypes,
	blockTypes,
	blockStyles,
	blockVariations,
	categories,
	defaultBlockName,
	freeformFallbackBlockName,
	unregisteredFallbackBlockName,
	groupingBlockName,
	DEFAULT_CATEGORIES,
} from '../reducer';

describe( 'unprocessedBlockTypes', () => {
	it( 'should return an empty object as default state', () => {
		expect( unprocessedBlockTypes( undefined, {} ) ).toEqual( {} );
	} );

	it( 'should add a new block type', () => {
		const original = deepFreeze( {
			'core/paragraph': { name: 'core/paragraph' },
		} );

		const state = unprocessedBlockTypes( original, {
			type: 'ADD_UNPROCESSED_BLOCK_TYPE',
			blockType: { name: 'core/code' },
		} );

		expect( state ).toEqual( {
			'core/paragraph': { name: 'core/paragraph' },
			'core/code': { name: 'core/code' },
		} );
	} );

	it( 'should remove unprocessed block types', () => {
		const original = deepFreeze( {
			'core/paragraph': { name: 'core/paragraph' },
			'core/code': { name: 'core/code' },
		} );

		const state = blockTypes( original, {
			type: 'REMOVE_BLOCK_TYPES',
			names: [ 'core/code' ],
		} );

		expect( state ).toEqual( {
			'core/paragraph': { name: 'core/paragraph' },
		} );
	} );
} );

describe( 'blockTypes', () => {
	it( 'should return an empty object as default state', () => {
		expect( blockTypes( undefined, {} ) ).toEqual( {} );
	} );

	it( 'should add a new block type', () => {
		const original = deepFreeze( {
			'core/paragraph': { name: 'core/paragraph' },
		} );

		const state = blockTypes( original, {
			type: 'ADD_BLOCK_TYPES',
			blockTypes: [ { name: 'core/code' } ],
		} );

		expect( state ).toEqual( {
			'core/paragraph': { name: 'core/paragraph' },
			'core/code': { name: 'core/code' },
		} );
	} );

	it( 'should remove block types', () => {
		const original = deepFreeze( {
			'core/paragraph': { name: 'core/paragraph' },
			'core/code': { name: 'core/code' },
		} );

		const state = blockTypes( original, {
			type: 'REMOVE_BLOCK_TYPES',
			names: [ 'core/code' ],
		} );

		expect( state ).toEqual( {
			'core/paragraph': { name: 'core/paragraph' },
		} );
	} );
} );

describe( 'blockStyles', () => {
	const blockName = 'core/image';

	it( 'should return an empty object as default state', () => {
		expect( blockStyles( undefined, {} ) ).toEqual( {} );
	} );

	it( 'should add a new block styles', () => {
		const original = deepFreeze( {} );

		let state = blockStyles( original, {
			type: 'ADD_BLOCK_STYLES',
			blockName,
			styles: [ { name: 'fancy' } ],
		} );

		expect( state ).toEqual( {
			[ blockName ]: [ { name: 'fancy' } ],
		} );

		state = blockStyles( state, {
			type: 'ADD_BLOCK_STYLES',
			blockName,
			styles: [ { name: 'lightbox' } ],
		} );

		expect( state ).toEqual( {
			[ blockName ]: [ { name: 'fancy' }, { name: 'lightbox' } ],
		} );
	} );

	it( 'should prepend block styles when adding a block', () => {
		const original = deepFreeze( {
			[ blockName ]: [ { name: 'fancy' } ],
		} );

		const state = blockStyles( original, {
			type: 'ADD_BLOCK_TYPES',
			blockTypes: [
				{
					name: blockName,
					styles: [ { name: 'original' } ],
				},
			],
		} );

		expect( state ).toEqual( {
			[ blockName ]: [
				{ name: 'original', source: 'block' },
				{ name: 'fancy' },
			],
		} );
	} );

	it( 'should replace block styles if block type added again', () => {
		const original = deepFreeze( {
			[ blockName ]: [ { name: 'original', source: 'block' } ],
		} );

		const state = blockStyles( original, {
			type: 'ADD_BLOCK_TYPES',
			blockTypes: [
				{
					name: blockName,
					styles: [ { name: 'original', value: 'replace' } ],
				},
			],
		} );

		expect( state ).toEqual( {
			[ blockName ]: [
				{ name: 'original', value: 'replace', source: 'block' },
			],
		} );
	} );

	it( 'should remove block styles', () => {
		const original = deepFreeze( {
			[ blockName ]: [ { name: 'fancy' }, { name: 'lightbox' } ],
		} );

		const state = blockStyles( original, {
			type: 'REMOVE_BLOCK_STYLES',
			blockName,
			styleNames: [ 'fancy' ],
		} );

		expect( state ).toEqual( {
			[ blockName ]: [ { name: 'lightbox' } ],
		} );
	} );
} );

describe( 'blockVariations', () => {
	const blockName = 'block/name';

	const blockVariationName = 'variation-name';
	const blockVariation = {
		name: blockVariationName,
		label: 'My variation',
	};

	const secondBlockVariationName = 'second-variation-name';
	const secondBlockVariation = {
		name: secondBlockVariationName,
		label: 'My Second Variation',
	};

	it( 'should return an empty object as default state', () => {
		const state = blockVariations( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'should add a new block variation when no variation register', () => {
		const initialState = deepFreeze( {} );

		const state = blockVariations(
			initialState,
			addBlockVariations( blockName, blockVariation )
		);

		expect( state ).toEqual( {
			[ blockName ]: [ blockVariation ],
		} );
	} );

	it( 'should add another variation when a block variation already present for the block', () => {
		const initialState = deepFreeze( {
			[ blockName ]: [ blockVariation ],
		} );

		const state = blockVariations(
			initialState,
			addBlockVariations( blockName, secondBlockVariation )
		);

		expect( state ).toEqual( {
			[ blockName ]: [ blockVariation, secondBlockVariation ],
		} );
	} );

	it( 'should prepend block variations added when adding a block', () => {
		const initialState = deepFreeze( {
			[ blockName ]: [ secondBlockVariation ],
		} );

		const state = blockVariations(
			initialState,
			addBlockTypes( {
				name: blockName,
				variations: [ blockVariation ],
			} )
		);

		expect( state ).toEqual( {
			[ blockName ]: [
				{ ...blockVariation, source: 'block' },
				secondBlockVariation,
			],
		} );
	} );

	it( 'should remove a block variation', () => {
		const initialState = deepFreeze( {
			[ blockName ]: [ blockVariation, secondBlockVariation ],
		} );

		const state = blockVariations(
			initialState,
			removeBlockVariations( blockName, blockVariationName )
		);

		expect( state ).toEqual( {
			[ blockName ]: [ secondBlockVariation ],
		} );
	} );
} );

describe( 'defaultBlockName', () => {
	it( 'should return null as default state', () => {
		expect( defaultBlockName( undefined, {} ) ).toBeNull();
	} );

	it( 'should set the default block name', () => {
		const state = defaultBlockName( null, {
			type: 'SET_DEFAULT_BLOCK_NAME',
			name: 'core/paragraph',
		} );

		expect( state ).toBe( 'core/paragraph' );
	} );

	it( 'should reset the default block name', () => {
		const state = defaultBlockName( 'core/code', {
			type: 'REMOVE_BLOCK_TYPES',
			names: [ 'core/code' ],
		} );

		expect( state ).toBeNull();
	} );
} );

describe( 'freeformFallbackBlockName', () => {
	it( 'should return null as default state', () => {
		expect( freeformFallbackBlockName( undefined, {} ) ).toBeNull();
	} );

	it( 'should set the freeform content fallback block name', () => {
		const state = freeformFallbackBlockName( null, {
			type: 'SET_FREEFORM_FALLBACK_BLOCK_NAME',
			name: 'core/paragraph',
		} );

		expect( state ).toBe( 'core/paragraph' );
	} );

	it( 'should reset the freeform content fallback block name', () => {
		const state = freeformFallbackBlockName( 'core/code', {
			type: 'REMOVE_BLOCK_TYPES',
			names: [ 'core/code' ],
		} );

		expect( state ).toBeNull();
	} );
} );

describe( 'groupingBlockName', () => {
	it( 'should return null as default state', () => {
		expect( groupingBlockName( undefined, {} ) ).toBeNull();
	} );

	it( 'should set the grouping block name', () => {
		const state = groupingBlockName( null, {
			type: 'SET_GROUPING_BLOCK_NAME',
			name: 'core/group',
		} );

		expect( state ).toBe( 'core/group' );
	} );

	it( 'should reset the group fallback block name', () => {
		const state = groupingBlockName( 'core/group', {
			type: 'REMOVE_BLOCK_TYPES',
			names: [ 'core/group' ],
		} );

		expect( state ).toBeNull();
	} );
} );

describe( 'unregisteredFallbackBlockName', () => {
	it( 'should return null as default state', () => {
		expect( unregisteredFallbackBlockName( undefined, {} ) ).toBeNull();
	} );

	it( 'should set the unregistered fallback block name', () => {
		const state = unregisteredFallbackBlockName( null, {
			type: 'SET_UNREGISTERED_FALLBACK_BLOCK_NAME',
			name: 'core/paragraph',
		} );

		expect( state ).toBe( 'core/paragraph' );
	} );

	it( 'should reset the unregistered fallback block name', () => {
		const state = unregisteredFallbackBlockName( 'core/code', {
			type: 'REMOVE_BLOCK_TYPES',
			names: [ 'core/code' ],
		} );

		expect( state ).toBeNull();
	} );
} );

describe( 'categories', () => {
	it( 'should return the default categories as default state', () => {
		expect( categories( undefined, {} ) ).toEqual( DEFAULT_CATEGORIES );
	} );

	it( 'should override categories', () => {
		const original = deepFreeze( [
			{ slug: 'chicken', title: 'Chicken' },
		] );

		const state = categories( original, {
			type: 'SET_CATEGORIES',
			categories: [ { slug: 'wings', title: 'Wings' } ],
		} );

		expect( state ).toEqual( [ { slug: 'wings', title: 'Wings' } ] );
	} );

	it( 'should add the category icon', () => {
		const original = deepFreeze( [
			{
				slug: 'chicken',
				title: 'Chicken',
			},
		] );

		const state = categories( original, {
			type: 'UPDATE_CATEGORY',
			slug: 'chicken',
			category: {
				icon: 'new-icon',
			},
		} );

		expect( state ).toEqual( [
			{
				slug: 'chicken',
				title: 'Chicken',
				icon: 'new-icon',
			},
		] );
	} );

	it( 'should update the category icon', () => {
		const original = deepFreeze( [
			{
				slug: 'chicken',
				title: 'Chicken',
				icon: 'old-icon',
			},
			{
				slug: 'wings',
				title: 'Wings',
				icon: 'old-icon',
			},
		] );

		const state = categories( original, {
			type: 'UPDATE_CATEGORY',
			slug: 'chicken',
			category: {
				icon: 'new-icon',
			},
		} );

		expect( state ).toEqual( [
			{
				slug: 'chicken',
				title: 'Chicken',
				icon: 'new-icon',
			},
			{
				slug: 'wings',
				title: 'Wings',
				icon: 'old-icon',
			},
		] );
	} );

	it( 'should update multiple category properties', () => {
		const original = deepFreeze( [
			{
				slug: 'chicken',
				title: 'Chicken',
				icon: 'old-icon',
			},
			{
				slug: 'wings',
				title: 'Wings',
				icon: 'old-icon',
			},
		] );

		const state = categories( original, {
			type: 'UPDATE_CATEGORY',
			slug: 'wings',
			category: {
				title: 'New Wings',
				chicken: 'ribs',
			},
		} );

		expect( state ).toEqual( [
			{
				slug: 'chicken',
				title: 'Chicken',
				icon: 'old-icon',
			},
			{
				slug: 'wings',
				title: 'New Wings',
				chicken: 'ribs',
				icon: 'old-icon',
			},
		] );
	} );
} );
