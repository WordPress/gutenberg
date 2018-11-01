/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { formatTypes } from '../reducer';

describe( 'formatTypes', () => {
	it( 'should return an empty object as default state', () => {
		expect( formatTypes( undefined, {} ) ).toEqual( {} );
	} );

	it( 'should add add a new format type', () => {
		const original = deepFreeze( {
			'core/bold': { name: 'core/bold' },
		} );

		const state = formatTypes( original, {
			type: 'ADD_FORMAT_TYPES',
			formatTypes: [ { name: 'core/code' } ],
		} );

		expect( state ).toEqual( {
			'core/bold': { name: 'core/bold' },
			'core/code': { name: 'core/code' },
		} );
	} );

	it( 'should remove format types', () => {
		const original = deepFreeze( {
			'core/bold': { name: 'core/bold' },
			'core/code': { name: 'core/code' },
		} );

		const state = formatTypes( original, {
			type: 'REMOVE_FORMAT_TYPES',
			names: [ 'core/code' ],
		} );

		expect( state ).toEqual( {
			'core/bold': { name: 'core/bold' },
		} );
	} );
} );
