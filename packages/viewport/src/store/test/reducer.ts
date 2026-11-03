import { describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import reducer from '../reducer';

describe( 'reducer', () => {
	it( 'defaults to an empty object', () => {
		const state = reducer(
			undefined,
			// @ts-expect-error {} is not a ViewportAction; an unknown action returns the default state.
			{}
		);

		expect( state ).toEqual( {} );
	} );

	it( 'replaces its state in response to new matching values', () => {
		const original = deepFreeze(
			reducer(
				undefined,
				// @ts-expect-error {} is not a ViewportAction; an unknown action returns the default state.
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
