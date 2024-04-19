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
		let notifsFromA = 0;
		let notifsFromB = 0;

		const unsubA = map.subscribe( 'a', () => {
			notifsFromA++;
		} );
		const unsubB = map.subscribe( 'b', () => {
			notifsFromB++;
		} );

		// check that setting `a` doesn't notify the `b` listener
		map.set( 'a', 1 );
		expect( notifsFromA ).toBe( 1 );
		expect( notifsFromB ).toBe( 0 );

		// check that setting `b` doesn't notify the `a` listener
		map.set( 'b', 2 );
		expect( notifsFromA ).toBe( 1 );
		expect( notifsFromB ).toBe( 1 );

		// check that `delete` triggers notifications, too
		map.delete( 'a' );
		expect( notifsFromA ).toBe( 2 );
		expect( notifsFromB ).toBe( 1 );

		// check that the subscription survived the `delete`
		map.set( 'a', 2 );
		expect( notifsFromA ).toBe( 3 );
		expect( notifsFromB ).toBe( 1 );

		// check that unsubscription really works.
		unsubA();
		unsubB();
		map.set( 'a', 3 );
		expect( notifsFromA ).toBe( 3 );
		expect( notifsFromB ).toBe( 1 );
	} );
} );

describe( 'useObservableValue', () => {
	test( 'reacts only to the specified key', () => {
		const map = observableMap();
		map.set( 'a', 1 );

		let renders = 0;
		function MapUI() {
			const value = useObservableValue( map, 'a' );
			renders++;
			return <div>value is { value }</div>;
		}

		render( <MapUI /> );
		expect( screen.getByText( /^value is/ ) ).toHaveTextContent(
			'value is 1'
		);
		expect( renders ).toBe( 1 );

		act( () => {
			map.set( 'a', 2 );
		} );
		expect( screen.getByText( /^value is/ ) ).toHaveTextContent(
			'value is 2'
		);
		expect( renders ).toBe( 2 );

		act( () => {
			map.set( 'b', 1 );
		} );
		expect( renders ).toBe( 2 );
	} );
} );
