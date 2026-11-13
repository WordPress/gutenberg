import { describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import { formatTypes } from '../reducer';
import type { FormatType } from '../../types';

describe( 'formatTypes', () => {
	it( 'should return an empty object as default state', () => {
		expect(
			formatTypes(
				undefined,
				// @ts-expect-error {} is not a valid Action; an unknown action returns the default state.
				{}
			)
		).toEqual( {} );
	} );

	it( 'should add a new format type', () => {
		const original = deepFreeze( {
			'core/bold': { name: 'core/bold' } as FormatType,
		} ) as Record< string, FormatType >;

		const state = formatTypes( original, {
			type: 'ADD_FORMAT_TYPES',
			formatTypes: [ { name: 'core/code' } as FormatType ],
		} );

		expect( state ).toEqual( {
			'core/bold': { name: 'core/bold' },
			'core/code': { name: 'core/code' },
		} );
	} );

	it( 'should remove format types', () => {
		const original = deepFreeze( {
			'core/bold': { name: 'core/bold' } as FormatType,
			'core/code': { name: 'core/code' } as FormatType,
		} ) as Record< string, FormatType >;

		const state = formatTypes( original, {
			type: 'REMOVE_FORMAT_TYPES',
			names: [ 'core/code' ],
		} );

		expect( state ).toEqual( {
			'core/bold': { name: 'core/bold' },
		} );
	} );
} );
