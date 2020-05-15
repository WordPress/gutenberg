/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import ifNotResolved from '../if-not-resolved';

jest.mock( '@wordpress/data-controls', () => ( {
	select: jest.fn(),
} ) );

describe( 'ifNotResolved', () => {
	beforeEach( () => {
		select.mockReset();
	} );

	it( 'returns a new function', () => {
		const originalResolver = () => {};

		const resolver = ifNotResolved( originalResolver, 'originalResolver' );

		expect( resolver ).toBeInstanceOf( Function );
	} );

	it( 'triggers original resolver if not already resolved', () => {
		select.mockImplementation( ( _storeKey, selectorName ) => ( {
			_nextValue:
				selectorName === 'hasStartedResolution' ? false : undefined,
		} ) );

		const originalResolver = jest.fn().mockImplementation( function*() {} );

		const resolver = ifNotResolved( originalResolver, 'originalResolver' );

		const runResolver = resolver();

		let next, nextValue;
		do {
			next = runResolver.next( nextValue );
			nextValue = next.value?._nextValue;
		} while ( ! next.done );

		expect( originalResolver ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not trigger original resolver if already resolved', () => {
		select.mockImplementation( ( _storeKey, selectorName ) => ( {
			_nextValue:
				selectorName === 'hasStartedResolution' ? true : undefined,
		} ) );

		const originalResolver = jest.fn().mockImplementation( function*() {} );

		const resolver = ifNotResolved( originalResolver, 'originalResolver' );

		const runResolver = resolver();

		let next, nextValue;
		do {
			next = runResolver.next( nextValue );
			nextValue = next.value?._nextValue;
		} while ( ! next.done );

		expect( originalResolver ).toHaveBeenCalledTimes( 0 );
	} );
} );
