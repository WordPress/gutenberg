/**
 * Internal dependencies
 */
import { observableMap } from '..';

describe( 'ObservableMap', () => {
	test( 'should observe individual values', () => {
		const map = observableMap();

		const listenerA = jest.fn();
		const listenerB = jest.fn();

		const unsubA = map.subscribe( 'a', listenerA );
		const unsubB = map.subscribe( 'b', listenerB );

		// check that setting `a` doesn't notify the `b` listener
		map.set( 'a', 1 );
		expect( listenerA ).toHaveBeenCalledTimes( 1 );
		expect( listenerB ).toHaveBeenCalledTimes( 0 );

		// check that setting `b` doesn't notify the `a` listener
		map.set( 'b', 2 );
		expect( listenerA ).toHaveBeenCalledTimes( 1 );
		expect( listenerB ).toHaveBeenCalledTimes( 1 );

		// check that `delete` triggers notifications, too
		map.delete( 'a' );
		expect( listenerA ).toHaveBeenCalledTimes( 2 );
		expect( listenerB ).toHaveBeenCalledTimes( 1 );

		// check that the subscription survived the `delete`
		map.set( 'a', 2 );
		expect( listenerA ).toHaveBeenCalledTimes( 3 );
		expect( listenerB ).toHaveBeenCalledTimes( 1 );

		// check that unsubscription really works
		unsubA();
		unsubB();
		map.set( 'a', 3 );
		expect( listenerA ).toHaveBeenCalledTimes( 3 );
		expect( listenerB ).toHaveBeenCalledTimes( 1 );
	} );
} );
