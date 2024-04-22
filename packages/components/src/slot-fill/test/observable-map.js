/**
 * External dependencies
 */
import { render, screen, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	observableMap,
	useObservableValue,
} from '../bubbles-virtually/observable-map';

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

describe( 'useObservableValue', () => {
	test( 'reacts only to the specified key', () => {
		const map = observableMap();
		map.set( 'a', 1 );

		const MapUI = jest.fn( () => {
			const value = useObservableValue( map, 'a' );
			return <div>value is { value }</div>;
		} );

		render( <MapUI /> );
		expect( screen.getByText( /^value is/ ) ).toHaveTextContent(
			'value is 1'
		);
		expect( MapUI ).toHaveBeenCalledTimes( 1 );

		act( () => {
			map.set( 'a', 2 );
		} );
		expect( screen.getByText( /^value is/ ) ).toHaveTextContent(
			'value is 2'
		);
		expect( MapUI ).toHaveBeenCalledTimes( 2 );

		// check that setting unobserved map key doesn't trigger a render at all
		act( () => {
			map.set( 'b', 1 );
		} );
		expect( MapUI ).toHaveBeenCalledTimes( 2 );
	} );
} );
