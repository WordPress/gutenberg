/**
 * External dependencies
 */
import {
	describe,
	expect,
	test,
	jest,
	beforeEach,
	afterEach,
} from '@jest/globals';
import * as Y from 'yjs';

/**
 * Internal dependencies
 */
import { AwarenessState } from '../awareness-state';
import type { EnhancedState, EqualityFieldCheck } from '../types';

interface TestState {
	name: string;
	count: number;
}

/**
 * Concrete implementation of AwarenessState for testing
 */
class TestAwarenessState extends AwarenessState< TestState > {
	public onSetUpCalled = false;

	protected equalityFieldChecks: {
		[ FieldName in keyof TestState ]: EqualityFieldCheck<
			TestState,
			FieldName
		>;
	} = {
		name: ( a, b ) => a === b,
		count: ( a, b ) => a === b,
	};

	protected onSetUp(): void {
		this.onSetUpCalled = true;
	}

	// Expose protected methods for testing
	public testIsFieldEqual< FieldName extends keyof TestState >(
		field: FieldName,
		value1?: TestState[ FieldName ],
		value2?: TestState[ FieldName ]
	): boolean {
		return this.isFieldEqual( field, value1, value2 );
	}

	public testIsStateEqual( state1: TestState, state2: TestState ): boolean {
		return this.isStateEqual( state1, state2 );
	}

	public testUpdateSubscribers( forceUpdate = false ): void {
		this.updateSubscribers( forceUpdate );
	}
}

describe( 'AwarenessState', () => {
	let doc: Y.Doc;
	let awareness: TestAwarenessState;

	beforeEach( () => {
		jest.useFakeTimers();
		doc = new Y.Doc();
		awareness = new TestAwarenessState( doc );
	} );

	afterEach( () => {
		jest.useRealTimers();
		doc.destroy();
	} );

	describe( 'setUp', () => {
		test( 'should call onSetUp on first invocation', () => {
			expect( awareness.onSetUpCalled ).toBe( false );
			awareness.setUp();
			expect( awareness.onSetUpCalled ).toBe( true );
		} );

		test( 'should only run once (idempotent)', () => {
			awareness.setUp();
			awareness.onSetUpCalled = false;
			awareness.setUp();
			expect( awareness.onSetUpCalled ).toBe( false );
		} );
	} );

	describe( 'getCurrentState', () => {
		test( 'should return empty array initially', () => {
			awareness.setUp();
			const states = awareness.getCurrentState();
			expect( states ).toEqual( [] );
		} );

		test( 'should return current state after setting local state', () => {
			awareness.setUp();
			awareness.setLocalStateField( 'name', 'Test' );
			awareness.setLocalStateField( 'count', 42 );

			// Subscribe to trigger state update
			const callback = jest.fn();
			awareness.onStateChange( callback );
			awareness.testUpdateSubscribers( true );

			const states = awareness.getCurrentState();
			expect( states.length ).toBe( 1 );
			expect( states[ 0 ].name ).toBe( 'Test' );
			expect( states[ 0 ].count ).toBe( 42 );
		} );
	} );

	describe( 'getSeenStates', () => {
		test( 'should return empty map initially', () => {
			awareness.setUp();
			const seenStates = awareness.getSeenStates();
			expect( seenStates.size ).toBe( 0 );
		} );

		test( 'should track seen states after update', () => {
			awareness.setUp();
			awareness.setLocalStateField( 'name', 'Test User' );
			awareness.setLocalStateField( 'count', 1 );

			// Subscribe and update to trigger state tracking
			const callback = jest.fn();
			awareness.onStateChange( callback );
			awareness.testUpdateSubscribers( true );

			const seenStates = awareness.getSeenStates();
			expect( seenStates.size ).toBe( 1 );
			expect( seenStates.get( awareness.clientID )?.name ).toBe(
				'Test User'
			);
		} );
	} );

	describe( 'onStateChange', () => {
		test( 'should register callback and receive updates', () => {
			awareness.setUp();
			const callback = jest.fn();

			awareness.onStateChange( callback );
			awareness.setLocalStateField( 'name', 'Test' );
			awareness.setLocalStateField( 'count', 5 );
			awareness.testUpdateSubscribers( true );

			expect( callback ).toHaveBeenCalled();
		} );

		test( 'should return unsubscribe function', () => {
			awareness.setUp();
			const callback = jest.fn();

			const unsubscribe = awareness.onStateChange( callback );
			awareness.setLocalStateField( 'name', 'Test' );
			awareness.setLocalStateField( 'count', 5 );
			awareness.testUpdateSubscribers( true );
			callback.mockClear();

			unsubscribe();
			awareness.setLocalStateField( 'name', 'Changed' );
			awareness.testUpdateSubscribers( true );

			expect( callback ).not.toHaveBeenCalled();
		} );

		test( 'should not call callback when state has not changed', () => {
			awareness.setUp();
			const callback = jest.fn();

			awareness.onStateChange( callback );
			awareness.setLocalStateField( 'name', 'Test' );
			awareness.setLocalStateField( 'count', 5 );
			awareness.testUpdateSubscribers( true );
			callback.mockClear();

			// Update without changing state
			awareness.testUpdateSubscribers( false );

			expect( callback ).not.toHaveBeenCalled();
		} );

		test( 'should call callback when forceUpdate is true', () => {
			awareness.setUp();
			const callback = jest.fn();

			awareness.onStateChange( callback );
			awareness.setLocalStateField( 'name', 'Test' );
			awareness.setLocalStateField( 'count', 5 );
			awareness.testUpdateSubscribers( true );
			callback.mockClear();

			// Force update without changing state
			awareness.testUpdateSubscribers( true );

			expect( callback ).toHaveBeenCalled();
		} );
	} );

	describe( 'setThrottledLocalStateField', () => {
		test( 'should set field immediately', () => {
			awareness.setUp();
			awareness.setThrottledLocalStateField( 'name', 'Throttled', 100 );

			expect( awareness.getLocalStateField( 'name' ) ).toBe(
				'Throttled'
			);
		} );

		test( 'should update field after throttle period', () => {
			awareness.setUp();
			awareness.setThrottledLocalStateField( 'name', 'First', 100 );

			// Verify initial throttled value is set
			expect( awareness.getLocalStateField( 'name' ) ).toBe( 'First' );

			// Set to a new value
			awareness.setLocalStateField( 'name', 'Second' );

			// Verify the value was updated
			expect( awareness.getLocalStateField( 'name' ) ).toBe( 'Second' );

			jest.advanceTimersByTime( 100 );

			// After throttle period, the value should still be the last set value
			expect( awareness.getLocalStateField( 'name' ) ).toBe( 'Second' );
		} );
	} );

	describe( 'setConnectionStatus', () => {
		test( 'should trigger subscriber update when connection changes', () => {
			awareness.setUp();
			const callback = jest.fn();
			awareness.onStateChange( callback );

			awareness.setLocalStateField( 'name', 'Test' );
			awareness.setLocalStateField( 'count', 1 );
			awareness.testUpdateSubscribers( true );
			callback.mockClear();

			awareness.setConnectionStatus( false );

			expect( callback ).toHaveBeenCalled();
		} );
	} );

	describe( 'setLocalStateField with equality checks', () => {
		test( 'should not trigger update when value is equal', () => {
			awareness.setUp();
			awareness.setLocalStateField( 'name', 'Same' );

			const callback = jest.fn();
			awareness.onStateChange( callback );
			awareness.testUpdateSubscribers( true );
			callback.mockClear();

			// Set same value
			awareness.setLocalStateField( 'name', 'Same' );
			awareness.testUpdateSubscribers( false );

			expect( callback ).not.toHaveBeenCalled();
		} );

		test( 'should trigger update when value changes', () => {
			awareness.setUp();
			awareness.setLocalStateField( 'name', 'Original' );

			const callback = jest.fn();
			awareness.onStateChange( callback );
			awareness.testUpdateSubscribers( true );
			callback.mockClear();

			// Set different value
			awareness.setLocalStateField( 'name', 'Changed' );
			awareness.testUpdateSubscribers( true );

			expect( callback ).toHaveBeenCalled();
		} );
	} );

	describe( 'isFieldEqual', () => {
		test( 'should use strict equality for clientId', () => {
			// Cast to access protected method via test helper
			expect(
				awareness.testIsFieldEqual( 'name' as any, 123, 123 )
			).toBe( true );
		} );

		test( 'should use custom equality check for defined fields', () => {
			expect( awareness.testIsFieldEqual( 'name', 'test', 'test' ) ).toBe(
				true
			);
			expect(
				awareness.testIsFieldEqual( 'name', 'test', 'other' )
			).toBe( false );
		} );

		test( 'should throw error for fields without equality check', () => {
			expect( () => {
				awareness.testIsFieldEqual( 'unknown' as any, 1, 2 );
			} ).toThrow(
				'No equality check implemented for awareness state field "unknown".'
			);
		} );
	} );

	describe( 'isStateEqual', () => {
		test( 'should return true for identical states', () => {
			const state1: TestState = { name: 'Test', count: 5 };
			const state2: TestState = { name: 'Test', count: 5 };

			expect( awareness.testIsStateEqual( state1, state2 ) ).toBe( true );
		} );

		test( 'should return false when name differs', () => {
			const state1: TestState = { name: 'Test1', count: 5 };
			const state2: TestState = { name: 'Test2', count: 5 };

			expect( awareness.testIsStateEqual( state1, state2 ) ).toBe(
				false
			);
		} );

		test( 'should return false when count differs', () => {
			const state1: TestState = { name: 'Test', count: 5 };
			const state2: TestState = { name: 'Test', count: 10 };

			expect( awareness.testIsStateEqual( state1, state2 ) ).toBe(
				false
			);
		} );
	} );

	describe( 'updateSubscribers', () => {
		test( 'should not call subscribers when no subscriptions exist', () => {
			awareness.setUp();
			// This should not throw
			awareness.testUpdateSubscribers();
		} );

		test( 'should include enhanced state properties', () => {
			awareness.setUp();
			let receivedStates: EnhancedState< TestState >[] = [];

			awareness.onStateChange( ( states ) => {
				receivedStates = states;
			} );

			awareness.setLocalStateField( 'name', 'Test' );
			awareness.setLocalStateField( 'count', 1 );
			awareness.testUpdateSubscribers( true );

			expect( receivedStates.length ).toBe( 1 );
			expect( receivedStates[ 0 ].clientId ).toBe( awareness.clientID );
			expect( receivedStates[ 0 ].isMe ).toBe( true );
			expect( receivedStates[ 0 ].isConnected ).toBe( true );
		} );
	} );

	describe( 'change event handling', () => {
		test( 'should update subscribers on awareness change', () => {
			awareness.setUp();
			const callback = jest.fn();
			awareness.onStateChange( callback );

			awareness.setLocalStateField( 'name', 'Test' );
			awareness.setLocalStateField( 'count', 1 );

			// Emit a change event manually
			awareness.emit( 'change', [
				{
					added: [],
					updated: [ awareness.clientID ],
					removed: [],
				},
			] );

			expect( callback ).toHaveBeenCalled();
		} );

		test( 'should handle user removal and delayed cleanup', () => {
			awareness.setUp();
			const callback = jest.fn();
			awareness.onStateChange( callback );

			awareness.setLocalStateField( 'name', 'Test' );
			awareness.setLocalStateField( 'count', 1 );
			awareness.testUpdateSubscribers( true );

			// Simulate user removal
			awareness.emit( 'change', [
				{
					added: [],
					updated: [],
					removed: [ 999 ],
				},
			] );

			// Should trigger update for removal
			expect( callback ).toHaveBeenCalled();
			callback.mockClear();

			// After REMOVAL_DELAY_IN_MS, should trigger another update
			jest.advanceTimersByTime( 5000 );
			expect( callback ).toHaveBeenCalled();
		} );
	} );
} );
