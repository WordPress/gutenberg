/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	blockTypes,
	categories,
	defaultBlockName,
	freeformFallbackBlockName,
	unregisteredFallbackBlockName,
	DEFAULT_CATEGORIES,
} from '../reducer';

describe( 'blockTypes', () => {
	it( 'should return an empty object as default state', () => {
		expect( blockTypes( undefined, {} ) ).toEqual( {} );
	} );

	it( 'should add add a new block type', () => {
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
} );
