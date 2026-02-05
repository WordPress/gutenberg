/**
 * Internal dependencies
 */
import { REMOVAL_DELAY_IN_MS } from './config';
import { TypedAwareness } from './typed-awareness';
import type { EnhancedState, EqualityFieldCheck } from './types';
import { getTypedKeys, areMapsEqual } from './utils';

type AwarenessClientID = number;

interface AwarenessStateChange {
	added: AwarenessClientID[];
	updated: AwarenessClientID[];
	removed: AwarenessClientID[];
}

abstract class AwarenessWithEqualityChecks<
	State extends object,
> extends TypedAwareness< State > {
	/** OVERRIDDEN METHODS */

	/**
	 * Set a local state field on an awareness document. Calling this method may
	 * trigger rerenders of any subscribed components.
	 *
	 * Equality checks are provided by the abstract `equalityFieldChecks` property.
	 * @param field - The field to set.
	 * @param value - The value to set.
	 */
	public setLocalStateField< FieldName extends string & keyof State >(
		field: FieldName,
		value: State[ FieldName ]
	): void {
		if (
			this.isFieldEqual(
				field,
				value,
				this.getLocalStateField( field ) ?? undefined
			)
		) {
			return;
		}

		super.setLocalStateField( field, value );
	}

	/** ABSTRACT PROPERTIES */

	/**
	 * Extending classes must implement equality checks for each awareness state
	 * field they manage.
	 */
	protected abstract equalityFieldChecks: {
		[ FieldName in keyof State ]: EqualityFieldCheck< State, FieldName >;
	};

	/** CUSTOM METHODS */

	/**
	 * Determine if a field value has changed using the provided equality checks.
	 * @param field  - The field to check.
	 * @param value1 - The first value to compare.
	 * @param value2 - The second value to compare.
	 */
	protected isFieldEqual< FieldName extends keyof State >(
		field: FieldName,
		value1?: State[ FieldName ],
		value2?: State[ FieldName ]
	): boolean {
		if (
			[ 'clientId', 'isConnected', 'isMe' ].includes( field as string )
		) {
			return value1 === value2;
		}

		if ( field in this.equalityFieldChecks ) {
			const fn = this.equalityFieldChecks[ field ];
			return fn( value1, value2 );
		}

		throw new Error(
			`No equality check implemented for awareness state field "${ field.toString() }".`
		);
	}

	/**
	 * Determine if two states are equal by comparing each field using the
	 * provided equality checks.
	 * @param state1 - The first state to compare.
	 * @param state2 - The second state to compare.
	 */
	protected isStateEqual( state1: State, state2: State ): boolean {
		return [
			...new Set< keyof State >( [
				...getTypedKeys( state1 ),
				...getTypedKeys( state2 ),
			] ),
		].every( ( field ) => {
			const value1 = state1[ field ];
			const value2 = state2[ field ];

			return this.isFieldEqual( field, value1, value2 );
		} );
	}
}

/**
 * Abstract class to manage awareness and allow external code to subscribe to
 * state updates.
 */
export abstract class AwarenessState<
	State extends object = {},
> extends AwarenessWithEqualityChecks< State > {
	/** CUSTOM PROPERTIES */

	/**
	 * Whether the setUp method has been called, to avoid running it multiple
	 * times.
	 */
	private hasSetupRun = false;

	/**
	 * We keep track of all seen states during the current session for two reasons:
	 *
	 * 1. So that we can represent recently disconnected users in our UI, even
	 *    after they have been removed from the awareness document.
	 * 2. So that we can provide debug information about all users seen during
	 *    the session.
	 */
	private disconnectedUsers: Set< number > = new Set();
	private seenStates: Map< number, State > = new Map();

	/**
	 * Hold a snapshot of the previous awareness state allows us to compare the
	 * state values and avoid unnecessary updates to subscribers.
	 */
	private previousSnapshot = new Map< number, EnhancedState< State > >();
	private stateSubscriptions: Array<
		( newState: EnhancedState< State >[] ) => void
	> = [];

	/**
	 * In some cases, we may want to throttle setting local state fields to avoid
	 * overwhelming the awareness document with rapid updates. At the same time, we
	 * want to ensure that when we read our own state locally, we get the latest
	 * value -- even if it hasn't yet been set on the awareness instance.
	 */
	private myThrottledState: Partial< State > = {};
	private throttleTimeouts: Map< string, NodeJS.Timeout > = new Map();

	/** CUSTOM METHODS */

	/**
	 * Set up the awareness state. This method is idempotent and will only run
	 * once. Subclasses should override `onSetUp()` instead of this method to
	 * add their own setup logic.
	 *
	 * This is defined as a readonly arrow function property to prevent
	 * subclasses from overriding it.
	 */
	public readonly setUp = (): void => {
		if ( this.hasSetupRun ) {
			return;
		}

		this.hasSetupRun = true;

		this.on(
			'change',
			( { added, removed, updated }: AwarenessStateChange ) => {
				[ ...added, ...updated ].forEach( ( id ) => {
					this.disconnectedUsers.delete( id );
				} );

				removed.forEach( ( id ) => {
					this.disconnectedUsers.add( id );

					setTimeout( () => {
						this.disconnectedUsers.delete( id );
						this.updateSubscribers( true /* force update */ );
					}, REMOVAL_DELAY_IN_MS );
				} );

				// Do not force-update the store here, since this change handler can be
				// called even when there are no actual state changes.
				this.updateSubscribers();
			}
		);

		this.onSetUp();
	};

	/**
	 * Hook method for subclasses to add their own setup logic. This is called
	 * once after the base class setup completes. All subclasses must implement
	 * this method. If extending a class that already implements `onSetUp()`,
	 * call `super.onSetUp()` to ensure parent setup runs.
	 */
	protected abstract onSetUp(): void;

	/**
	 * Get the most recent state from the last processed change event.
	 *
	 * @return An array of EnhancedState< State >.
	 */
	public getCurrentState(): EnhancedState< State >[] {
		return Array.from( this.previousSnapshot.values() );
	}

	/**
	 * Get all seen states in this session to enable debug reporting.
	 */
	public getSeenStates(): Map< number, State > {
		return this.seenStates;
	}

	/**
	 * Allow external code to subscribe to awareness state changes.
	 * @param callback - The callback to subscribe to.
	 */
	public onStateChange(
		callback: ( newState: EnhancedState< State >[] ) => void
	): () => void {
		this.stateSubscriptions.push( callback );

		return () => {
			this.stateSubscriptions = this.stateSubscriptions.filter(
				( cb ) => cb !== callback
			);
		};
	}

	/**
	 * Set a local state field on an awareness document with throttle. See caveats
	 * of this.setLocalStateField.
	 * @param field - The field to set.
	 * @param value - The value to set.
	 * @param wait  - The wait time in milliseconds.
	 */
	public setThrottledLocalStateField<
		FieldName extends string & keyof State,
	>( field: FieldName, value: State[ FieldName ], wait: number ): void {
		this.setLocalStateField( field, value );

		this.throttleTimeouts.set(
			field,
			setTimeout( () => {
				this.throttleTimeouts.delete( field );
				if ( this.myThrottledState[ field ] ) {
					this.setLocalStateField(
						field,
						this.myThrottledState[ field ]
					);

					delete this.myThrottledState[ field ];
				}
			}, wait )
		);
	}

	/**
	 * Set the current user's connection status as awareness state.
	 * @param isConnected - The connection status.
	 */
	public setConnectionStatus( isConnected: boolean ): void {
		if ( isConnected ) {
			this.disconnectedUsers.delete( this.clientID );
		} else {
			this.disconnectedUsers.add( this.clientID );
		}

		this.updateSubscribers( true /* force update */ );
	}

	/**
	 * Update all subscribed listeners with the latest awareness state.
	 * @param forceUpdate - Whether to force an update.
	 */
	protected updateSubscribers( forceUpdate = false ): void {
		if ( ! this.stateSubscriptions.length ) {
			return;
		}

		const states = this.getStates();

		this.seenStates = new Map< number, State >( [
			...this.seenStates.entries(),
			...states.entries(),
		] );

		const updatedStates = new Map< number, EnhancedState< State > >(
			[ ...this.disconnectedUsers, ...states.keys() ]
				.filter( ( clientId ) => {
					// Exclude any users with empty awareness state. This can happen from
					// the Yjs inspector.
					return (
						Object.keys( this.seenStates.get( clientId ) ?? {} )
							.length > 0
					);
				} )
				.map( ( clientId ) => {
					// The filter above ensures that seenStates has the clientId.
					const rawState: State = this.seenStates.get( clientId )!;

					const isConnected =
						! this.disconnectedUsers.has( clientId );
					const isMe = clientId === this.clientID;
					const myState: Partial< State > = isMe
						? this.myThrottledState
						: {};
					const state: EnhancedState< State > = {
						...rawState,
						...myState,
						clientId,
						isConnected,
						isMe,
					};

					return [ clientId, state ];
				} )
		);

		if ( ! forceUpdate ) {
			if (
				areMapsEqual(
					this.previousSnapshot,
					updatedStates,
					this.isStateEqual.bind( this )
				)
			) {
				// Awareness state unchanged, do not update subscribers.
				return;
			}
		}

		// Update subscribers.
		this.previousSnapshot = updatedStates;
		this.stateSubscriptions.forEach( ( callback ) => {
			callback( Array.from( updatedStates.values() ) );
		} );
	}
}
