/**
 * External dependencies
 */
import { render, screen, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { observableMap } from '../../../utils/observable-map';
import useObservableValue from '..';

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
