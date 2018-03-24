/**
 * Internal dependencies.
 */
import reducer from '../reducer';

describe( 'reducer', () => {
	it( 'registers a plugin', () => {
		const state = {};
		const expectedState = {
			'plugin-name': {
				name: 'plugin-name',
			},
		};
		const action = {
			type: 'REGISTER_PLUGIN',
			name: 'plugin-name',
			settings: {
				name: 'plugin-name',
			},
		};
		expect( reducer( state, action ) ).toEqual( expectedState );
	} );

	it( 'registers an additional plugin', () => {
		const state = {
			'plugin-name': {
				name: 'plugin-name',
			},
		};
		const expectedState = {
			'plugin-name': {
				name: 'plugin-name',
			},
			'second-plugin': {
				name: 'second-plugin',
			},
		};
		const action = {
			type: 'REGISTER_PLUGIN',
			name: 'second-plugin',
			settings: {
				name: 'second-plugin',
			},
		};
		expect( reducer( state, action ) ).toEqual( expectedState );
	} );

	it( 'unregisters a plugin', () => {
		const state = {
			'plugin-name': {
				name: 'plugin-name',
			},
			'second-plugin': {
				name: 'second-plugin',
			},
		};
		const expectedState = {
			'second-plugin': {
				name: 'second-plugin',
			},
		};
		const action = {
			type: 'UNREGISTER_PLUGIN',
			name: 'plugin-name',
		};
		expect( reducer( state, action ) ).toEqual( expectedState );
	} );
} );
