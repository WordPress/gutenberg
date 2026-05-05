/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useHistory } from '../use-history';

interface TestState {
	value: number;
}

function useNumberHistory() {
	const [ state, setState ] = useState< TestState >( { value: 0 } );
	const history = useHistory( {
		state,
		isEqual: ( a, b ) => a.value === b.value,
		onApplyState: setState,
		debounceMs: 300,
	} );
	return { state, setState, ...history };
}

describe( 'useHistory', () => {
	beforeEach( () => jest.useFakeTimers() );
	afterEach( () => jest.useRealTimers() );

	it( 'debounces continuous state changes into one undo entry', () => {
		const { result } = renderHook( () => useNumberHistory() );

		act( () => {
			result.current.setState( { value: 1 } );
			result.current.setState( { value: 2 } );
			result.current.setState( { value: 3 } );
		} );

		expect( result.current.hasUndo ).toBe( false );

		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current.hasUndo ).toBe( true );

		act( () => result.current.undo() );

		expect( result.current.state.value ).toBe( 0 );
		expect( result.current.hasUndo ).toBe( false );
		expect( result.current.hasRedo ).toBe( true );
	} );

	it( 'can flush a pending entry immediately', () => {
		const { result } = renderHook( () => useNumberHistory() );

		act( () => result.current.setState( { value: 1 } ) );
		act( () => result.current.commitHistory() );

		expect( result.current.hasUndo ).toBe( true );
	} );

	it( 'pushes discrete entries immediately and clears redo', () => {
		const { result } = renderHook( () => useNumberHistory() );

		act( () => result.current.setState( { value: 1 } ) );
		act( () => result.current.commitHistory() );
		act( () => result.current.undo() );

		expect( result.current.hasRedo ).toBe( true );

		act( () => {
			result.current.pushHistory();
			result.current.suppressNextChange();
			result.current.setState( { value: 2 } );
		} );

		expect( result.current.hasRedo ).toBe( false );
		expect( result.current.hasUndo ).toBe( true );
	} );

	it( 'suppresses a state change without creating history', () => {
		const { result } = renderHook( () => useNumberHistory() );

		act( () => {
			result.current.suppressNextChange();
			result.current.setState( { value: 1 } );
		} );
		act( () => jest.advanceTimersByTime( 300 ) );

		expect( result.current.state.value ).toBe( 1 );
		expect( result.current.hasUndo ).toBe( false );
	} );
} );
