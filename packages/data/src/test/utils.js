/**
 * Internal dependencies
 */
import { createRegistry } from '../registry';
import { waitForTransition } from '../utils';

describe( 'waitForTransition', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistry();
		registry.registerStore( 'test', {
			reducer: ( state = { saving: false }, action ) => {
				if ( action.type === 'SET_SAVING' ) {
					return { ...state, saving: action.saving };
				}
				return state;
			},
			selectors: {
				isSaving: ( state ) => state.saving,
			},
			actions: {
				setSaving: ( saving ) => ( { type: 'SET_SAVING', saving } ),
			},
		} );
	} );

	it( 'should resolve when predicate transitions from true to false', async () => {
		const promise = waitForTransition(
			() => registry.select( 'test' ).isSaving(),
			registry
		);

		// Transition to true.
		registry.dispatch( 'test' ).setSaving( true );

		// Transition to false - should resolve.
		registry.dispatch( 'test' ).setSaving( false );

		await expect( promise ).resolves.toBeUndefined();
	} );

	it( 'should not resolve on false to true transition only', async () => {
		let resolved = false;
		const promise = waitForTransition(
			() => registry.select( 'test' ).isSaving(),
			registry
		).then( () => {
			resolved = true;
		} );

		// Transition to true only.
		registry.dispatch( 'test' ).setSaving( true );

		// Give it a tick to ensure the promise hasn't resolved.
		await Promise.resolve();

		expect( resolved ).toBe( false );

		// Complete the transition to false.
		registry.dispatch( 'test' ).setSaving( false );
		await promise;
		expect( resolved ).toBe( true );
	} );

	it( 'should ignore multiple true values before false', async () => {
		let resolveCount = 0;
		const promise = waitForTransition(
			() => registry.select( 'test' ).isSaving(),
			registry
		).then( () => {
			resolveCount++;
		} );

		// Multiple true values.
		registry.dispatch( 'test' ).setSaving( true );
		registry.dispatch( 'test' ).setSaving( true );
		registry.dispatch( 'test' ).setSaving( true );

		// Finally transition to false.
		registry.dispatch( 'test' ).setSaving( false );

		await promise;
		expect( resolveCount ).toBe( 1 );
	} );

	it( 'should call predicate only once per state change', async () => {
		const predicate = jest.fn( () => registry.select( 'test' ).isSaving() );

		const promise = waitForTransition( predicate, registry );

		// Transition to true.
		registry.dispatch( 'test' ).setSaving( true );
		// Transition to false.
		registry.dispatch( 'test' ).setSaving( false );

		await promise;

		// Predicate is called once for the initial check plus once per dispatch.
		expect( predicate ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'should unsubscribe after resolving', async () => {
		const predicate = jest.fn( () => registry.select( 'test' ).isSaving() );

		const promise = waitForTransition( predicate, registry );

		// Complete the transition.
		registry.dispatch( 'test' ).setSaving( true );
		registry.dispatch( 'test' ).setSaving( false );

		await promise;

		const callCountAfterResolve = predicate.mock.calls.length;

		// Additional state changes should not trigger more predicate invocations.
		registry.dispatch( 'test' ).setSaving( true );
		registry.dispatch( 'test' ).setSaving( false );

		// Predicate should not have been called again after unsubscribe.
		expect( predicate ).toHaveBeenCalledTimes( callCountAfterResolve );
	} );

	it( 'should reject and unsubscribe when the predicate throws', async () => {
		const error = new Error( 'predicate failed' );
		let throwOnNextCall = false;
		const predicate = jest.fn( () => {
			if ( throwOnNextCall ) {
				throw error;
			}
			return registry.select( 'test' ).isSaving();
		} );

		const promise = waitForTransition( predicate, registry );

		// Arrange for the next predicate() invocation (inside the subscribe
		// listener) to throw.
		throwOnNextCall = true;
		registry.dispatch( 'test' ).setSaving( true );

		await expect( promise ).rejects.toBe( error );

		// Further state changes must not invoke the predicate again, which
		// confirms the subscription was released when the predicate threw.
		const callCountAfterReject = predicate.mock.calls.length;
		throwOnNextCall = false;
		registry.dispatch( 'test' ).setSaving( false );
		expect( predicate ).toHaveBeenCalledTimes( callCountAfterReject );
	} );

	it( 'should work with already true initial state', async () => {
		// Set initial state to true before calling waitForTransition.
		registry.dispatch( 'test' ).setSaving( true );

		const promise = waitForTransition(
			() => registry.select( 'test' ).isSaving(),
			registry
		);

		// Transition to false - should resolve.
		registry.dispatch( 'test' ).setSaving( false );

		await expect( promise ).resolves.toBeUndefined();
	} );
} );
