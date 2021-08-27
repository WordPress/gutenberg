/**
 * WordPress dependencies
 */
import { controls } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ifNotResolved from '../if-not-resolved';

jest.mock( '@wordpress/data', () => ( {
	controls: {
		select: jest.fn(),
	},
} ) );

describe( 'ifNotResolved', () => {
	beforeEach( () => {
		controls.select.mockReset();
	} );

	it( 'returns a new function', () => {
		const originalResolver = () => {};

		const resolver = ifNotResolved( originalResolver, 'originalResolver' );

		expect( resolver ).toBeInstanceOf( Function );
	} );

	it( 'triggers original resolver if not already resolved', async () => {
		const select = { hasStartedResolution: () => false };
		const dispatch = () => {};

		const originalResolver = jest
			.fn()
			.mockImplementation( async function () {} );

		const resolver = ifNotResolved( originalResolver, 'originalResolver' );
		await resolver()( { select, dispatch } );

		expect( originalResolver ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not trigger original resolver if already resolved', async () => {
		const select = { hasStartedResolution: () => true };
		const dispatch = () => {};

		const originalResolver = jest
			.fn()
			.mockImplementation( async function () {} );

		const resolver = ifNotResolved( originalResolver, 'originalResolver' );
		await resolver()( { select, dispatch } );

		expect( originalResolver ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'returns a promise when the resolver was not already resolved', async () => {
		const select = { hasStartedResolution: () => false };
		let thunkRetval;
		const dispatch = jest.fn( ( thunk ) => {
			thunkRetval = thunk();
			return thunkRetval;
		} );

		const originalResolver = jest.fn( () => () =>
			Promise.resolve( 'success!' )
		);

		const resolver = ifNotResolved( originalResolver, 'originalResolver' );
		const result = resolver()( { select, dispatch } );

		await expect( result ).resolves.toBe( undefined );
		await expect( thunkRetval ).resolves.toBe( 'success!' );
	} );
} );
