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
} );
