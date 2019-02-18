/**
 * Internal dependencies
 */
import {
	hasSameKeys,
	isUpdatingSameBlockAttribute,
} from '../';

describe( 'hasSameKeys()', () => {
	it( 'returns false if two objects do not have the same keys', () => {
		const a = { foo: 10 };
		const b = { bar: 10 };

		expect( hasSameKeys( a, b ) ).toBe( false );
	} );

	it( 'returns false if two objects have the same keys', () => {
		const a = { foo: 10 };
		const b = { foo: 20 };

		expect( hasSameKeys( a, b ) ).toBe( true );
	} );
} );

describe( 'isUpdatingSameBlockAttribute()', () => {
	it( 'should return false if not updating block attributes', () => {
		const action = {
			type: 'START_TYPING',
			edits: {},
		};
		const previousAction = {
			type: 'START_TYPING',
			edits: {},
		};

		expect( isUpdatingSameBlockAttribute( action, previousAction ) ).toBe( false );
	} );

	it( 'should return false if not updating the same block', () => {
		const action = {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			attributes: {
				foo: 10,
			},
		};
		const previousAction = {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
			attributes: {
				foo: 20,
			},
		};

		expect( isUpdatingSameBlockAttribute( action, previousAction ) ).toBe( false );
	} );

	it( 'should return false if not updating the same block attributes', () => {
		const action = {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			attributes: {
				foo: 10,
			},
		};
		const previousAction = {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			attributes: {
				bar: 20,
			},
		};

		expect( isUpdatingSameBlockAttribute( action, previousAction ) ).toBe( false );
	} );

	it( 'should return true if updating the same block attributes', () => {
		const action = {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			attributes: {
				foo: 10,
			},
		};
		const previousAction = {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientId: '9db792c6-a25a-495d-adbd-97d56a4c4189',
			attributes: {
				foo: 20,
			},
		};

		expect( isUpdatingSameBlockAttribute( action, previousAction ) ).toBe( true );
	} );
} );
