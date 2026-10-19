import { describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import reducer from '../reducer';

describe( 'reducer', () => {
	it( 'defaults to an empty object', () => {
		const state = reducer(
			undefined,
			// @ts-expect-error An empty action exercises the reducer's default state.
			{}
		);

		expect( state ).toEqual( {} );
	} );

	it( 'replaces its state in response to new matching values', () => {
		const original = deepFreeze(
			reducer(
				undefined,
				// @ts-expect-error An empty action exercises the reducer's default state.
				{}
			)
		);
		const state = reducer( original, {
			type: 'SET_IS_MATCHING',
			values: {
				huge: true,
			},
		} );

		expect( state ).toEqual( {
			huge: true,
		} );
	} );
} );
