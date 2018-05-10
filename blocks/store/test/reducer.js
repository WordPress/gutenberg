/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { blockTypes, categories, DEFAULT_CATEGORIES } from '../reducer';

describe( 'blockTypes', () => {
	it( 'should return an empty array as default state', () => {
		expect( blockTypes( undefined, {} ) ).toEqual( [] );
	} );

	it( 'should add add a new block type', () => {
		const original = deepFreeze( [
			{ name: 'core/paragraph' },
		] );

		const state = blockTypes( original, {
			type: 'ADD_BLOCK_TYPES',
			blockTypes: [ { name: 'core/code' } ],
		} );

		expect( state ).toEqual( [
			{ name: 'core/paragraph' },
			{ name: 'core/code' },
		] );
	} );

	it( 'should remove block types', () => {
		const original = deepFreeze( [
			{ name: 'core/paragraph' },
			{ name: 'core/code' },
		] );

		const state = blockTypes( original, {
			type: 'REMOVE_BLOCK_TYPES',
			names: [ 'core/code' ],
		} );

		expect( state ).toEqual( [
			{ name: 'core/paragraph' },
		] );
	} );
} );

describe( 'categories', () => {
	it( 'should return the default categories as default state', () => {
		expect( categories( undefined, {} ) ).toEqual( DEFAULT_CATEGORIES );
	} );

	it( 'should add add a new category', () => {
		const original = deepFreeze( [
			{ slug: 'chicken', title: 'Chicken' },
		] );

		const state = categories( original, {
			type: 'ADD_CATEGORIES',
			categories: [ { slug: 'wings', title: 'Wings' } ],
		} );

		expect( state ).toEqual( [
			{ slug: 'chicken', title: 'Chicken' },
			{ slug: 'wings', title: 'Wings' },
		] );
	} );
} );
