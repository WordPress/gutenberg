import { describe, expect, it } from 'vitest';
import reducer from '../reducer';

describe( 'loaderStates', () => {
	it( 'drops the loading state of an unregistered loader', () => {
		const loading = reducer( undefined, {
			type: 'SET_LOADER_LOADING',
			name: 'test/loader',
			isLoading: true,
		} );
		const state = reducer( loading, {
			type: 'UNREGISTER_COMMAND_LOADER',
			name: 'test/loader',
		} );

		expect( state.loaderStates ).toEqual( {} );
	} );
} );
