/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { formatTypes } from '../reducer';
import type { State, RichTextFormatFull } from '../../types';

describe( 'formatTypes', () => {
	it( 'should return an empty object as default state', () => {
		expect(
			formatTypes(
				undefined,
				{} as Parameters< typeof formatTypes >[ 1 ]
			)
		).toEqual( {} );
	} );

	it( 'should add a new format type', () => {
		const original = deepFreeze( {
			'core/bold': { name: 'core/bold' } as RichTextFormatFull,
		} ) as State[ 'formatTypes' ];

		const state = formatTypes( original, {
			type: 'ADD_FORMAT_TYPES',
			formatTypes: [ { name: 'core/code' } as RichTextFormatFull ],
		} );

		expect( state ).toEqual( {
			'core/bold': { name: 'core/bold' },
			'core/code': { name: 'core/code' },
		} );
	} );

	it( 'should remove format types', () => {
		const original = deepFreeze( {
			'core/bold': { name: 'core/bold' } as RichTextFormatFull,
			'core/code': { name: 'core/code' } as RichTextFormatFull,
		} ) as State[ 'formatTypes' ];

		const state = formatTypes( original, {
			type: 'REMOVE_FORMAT_TYPES',
			names: [ 'core/code' ],
		} );

		expect( state ).toEqual( {
			'core/bold': { name: 'core/bold' },
		} );
	} );
} );
