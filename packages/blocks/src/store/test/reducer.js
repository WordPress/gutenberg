/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	blockStyles,
	blockTypes,
	categories,
	defaultBlockName,
	freeformFallbackBlockName,
	unregisteredFallbackBlockName,
	groupingBlockName,
	DEFAULT_CATEGORIES,
} from '../reducer';

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
	it( 'should return an empty object as default state', () => {
		expect( blockStyles( undefined, {} ) ).toEqual( {} );
	} );

	it( 'should add a new block styles', () => {
		const original = deepFreeze( {} );

		let state = blockStyles( original, {
			type: 'ADD_BLOCK_STYLES',
			blockName: 'core/image',
			styles: [ { name: 'fancy' } ],
		} );

		expect( state ).toEqual( {
			'core/image': [
				{ name: 'fancy' },
			],
		} );

		state = blockStyles( state, {
			type: 'ADD_BLOCK_STYLES',
			blockName: 'core/image',
			styles: [ { name: 'lightbox' } ],
		} );

		expect( state ).toEqual( {
			'core/image': [
				{ name: 'fancy' },
				{ name: 'lightbox' },
			],
		} );
	} );

	it( 'should add block styles when adding a block', () => {
		const original = deepFreeze( {
			'core/image': [
				{ name: 'fancy' },
			],
		} );

		const state = blockStyles( original, {
			type: 'ADD_BLOCK_TYPES',
			blockTypes: [ {
				name: 'core/image',
				styles: [
					{ name: 'original' },
				],
			} ],
		} );

		expect( state ).toEqual( {
			'core/image': [
				{ name: 'original' },
				{ name: 'fancy' },
			],
		} );
	} );

	it( 'should remove block styles', () => {
		const original = deepFreeze( {
			'core/image': [
				{ name: 'fancy' },
				{ name: 'lightbox' },
			],
		} );

		const state = blockStyles( original, {
			type: 'REMOVE_BLOCK_STYLES',
			blockName: 'core/image',
			styleNames: [ 'fancy' ],
		} );

		expect( state ).toEqual( {
			'core/image': [
				{ name: 'lightbox' },
			],
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

		expect( state ).toEqual( [
			{ slug: 'wings', title: 'Wings' },
		] );
	} );

	it( 'should add the category icon', () => {
		const original = deepFreeze( [ {
			slug: 'chicken',
			title: 'Chicken',
		} ] );

		const state = categories( original, {
			type: 'UPDATE_CATEGORY',
			slug: 'chicken',
			category: {
				icon: 'new-icon',
			},
		} );

		expect( state ).toEqual( [ {
			slug: 'chicken',
			title: 'Chicken',
			icon: 'new-icon',
		} ] );
	} );

	it( 'should update the category icon', () => {
		const original = deepFreeze( [ {
			slug: 'chicken',
			title: 'Chicken',
			icon: 'old-icon',
		}, {
			slug: 'wings',
			title: 'Wings',
			icon: 'old-icon',
		} ] );

		const state = categories( original, {
			type: 'UPDATE_CATEGORY',
			slug: 'chicken',
			category: {
				icon: 'new-icon',
			},
		} );

		expect( state ).toEqual( [ {
			slug: 'chicken',
			title: 'Chicken',
			icon: 'new-icon',
		}, {
			slug: 'wings',
			title: 'Wings',
			icon: 'old-icon',
		} ] );
	} );

	it( 'should update multiple category properties', () => {
		const original = deepFreeze( [ {
			slug: 'chicken',
			title: 'Chicken',
			icon: 'old-icon',
		}, {
			slug: 'wings',
			title: 'Wings',
			icon: 'old-icon',
		} ] );

		const state = categories( original, {
			type: 'UPDATE_CATEGORY',
			slug: 'wings',
			category: {
				title: 'New Wings',
				chicken: 'ribs',
			},
		} );

		expect( state ).toEqual( [ {
			slug: 'chicken',
			title: 'Chicken',
			icon: 'old-icon',
		}, {
			slug: 'wings',
			title: 'New Wings',
			chicken: 'ribs',
			icon: 'old-icon',
		} ] );
	} );
} );
