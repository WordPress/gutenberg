import {
	TypedAwareness,
	type BaseState,
	type EnhancedState,
	type EqualityFieldCheck,
} from './awareness-types';

import { getTypedKeys, areMapsEqual } from '../utils';
import { REMOVAL_DELAY_IN_MS } from '../config';

type AwarenessClientID = number;

interface AwarenessStateChange {
	added: AwarenessClientID[];
	updated: AwarenessClientID[];
	removed: AwarenessClientID[];
}

abstract class AwarenessWithEqualityChecks<
	State extends BaseState = BaseState,
> extends TypedAwareness< State > {
	/** OVERRIDDEN METHODS **/

	/**
	 * Set a local state field on an awareness document. Calling this method may
	 * trigger rerenders of any subscribed components.
	 *
	 * Equality checks are provided by the abstract `equalityFieldChecks` property.
	 */
	public setLocalStateField< FieldName extends string & keyof State >(
		field: FieldName,
		value: State[ FieldName ]
	): void {
		if ( this.isFieldEqual( field, value, this.getLocalStateField( field ) ?? undefined ) ) {
			return;
		}

		super.setLocalStateField( field, value );
	}

	/** ABSTRACT PROPERTIES **/

	/**
	 * Extending classes must implement equality checks for each awareness state
	 * field they manage.
	 */
	protected abstract equalityFieldChecks: {
		[ FieldName in keyof State ]: EqualityFieldCheck< State, FieldName >;
	};

	/** CUSTOM METHODS **/

	/**
	 * Determine if a field value has changed using the provided equality checks.
	 */
	protected isFieldEqual< FieldName extends keyof State >(
		field: FieldName,
		value1?: State[ FieldName ],
		value2?: State[ FieldName ]
	): boolean {
		if ( [ 'clientId', 'isConnected', 'isMe' ].includes( field as string ) ) {
			return value1 === value2;
		}

		if ( field in this.equalityFieldChecks ) {
			// eslint-disable-next-line security/detect-object-injection
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
	 */
	protected isStateEqual( state1: State, state2: State ): boolean {
		return [
			...new Set< keyof State >( [ ...getTypedKeys( state1 ), ...getTypedKeys( state2 ) ] ),
		].every( field => {
			/* eslint-disable security/detect-object-injection */
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
	State extends BaseState = BaseState,
> extends AwarenessWithEqualityChecks< State > {
	/** CUSTOM PROPERTIES **/

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
	private previousSnapshot = new Map< number, State >();
	private stateSubscriptions: Array< ( newState: EnhancedState< State >[] ) => void > = [];

	/**
	 * In some cases, we may want to throttle setting local state fields to avoid
	 * overwhelming the awareness document with rapid updates. At the same time, we
	 * want to ensure that when we read our own state locally, we get the latest
	 * value -- even if it hasn't yet been set on the awareness instance.
	 */
	private myThrottledState: Partial< State > = {};
	private throttleTimeouts: Map< string, NodeJS.Timeout > = new Map();

	/** CUSTOM METHODS **/

	/**
	 * Set up.
	 */
	public setUp( /*userInfo: UserInfo */ ): void {
		// this.setLocalStateField( 'userInfo', userInfo );

		this.on( 'change', ( { added, removed, updated }: AwarenessStateChange ) => {
			[ ...added, ...updated ].forEach( id => {
				this.disconnectedUsers.delete( id );
			} );

			// added.forEach( id => {
			// 	// Send notification for added users.
			// 	const addedUserInfo = this.getStates().get( id )?.userInfo;
			// 	if ( addedUserInfo ) {
			// 		sendNotification( NotificationType.UserEntered, addedUserInfo, undefined, userInfo );
			// 	}
			// } );

			removed.forEach( id => {
				this.disconnectedUsers.add( id );

				setTimeout( () => {
					this.disconnectedUsers.delete( id );
					this.updateSubscribers( true /* force update */ );

					// Send notification.
					// const removedUserInfo = this.seenStates.get( id )?.userInfo;
					// if ( removedUserInfo ) {
					// 	sendNotification( NotificationType.UserExited, removedUserInfo );
					// }
				}, REMOVAL_DELAY_IN_MS );
			} );

			// Do not force-update the store here, since this change handler can be
			// called even when there are no actual state changes.
			this.updateSubscribers();
		} );
	}

	/**
	 * Get all seen states in this session to enable debug reporting.
	 */
	public getSeenStates(): Map< number, State > {
		return this.seenStates;
	}

	/**
	 * Allow external code to subscribe to awareness state changes.
	 */
	public onStateChange( callback: ( newState: EnhancedState< State >[] ) => void ): () => void {
		this.stateSubscriptions.push( callback );

		return () => {
			this.stateSubscriptions = this.stateSubscriptions.filter( cb => cb !== callback );
		};
	}

	/**
	 * Set a local state field on an awareness document with throttle. See caveats
	 * of this.setLocalStateField.
	 */
	public setThrottledLocalStateField< FieldName extends string & keyof State >(
		field: FieldName,
		value: State[ FieldName ],
		wait: number
	): void {
		if ( this.throttleTimeouts.has( field ) ) {
			this.myThrottledState[ field ] = value;
			this.updateSubscribers( true /* force update */ );
			return;
		}

		this.setLocalStateField( field, value );

		this.throttleTimeouts.set(
			field,
			setTimeout( () => {
				this.throttleTimeouts.delete( field );
				if ( this.myThrottledState[ field ] ) {
					this.setLocalStateField( field, this.myThrottledState[ field ] );
					// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
					delete this.myThrottledState[ field ];
				}
			}, wait )
		);
	}

	/**
	 * Set the current user's connection status as awareness state.
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
				// .filter( clientId => {
				// 	// Exclude any users without `userInfo`.
				// 	// This can happen from the Yjs inspector, which joins the awareness
				// 	// state without providing user data.
				// 	return Boolean( this.seenStates.get( clientId )?.userInfo );
				// } )
				.map( clientId => {
					// The filter above ensures that seenStates has the clientId.
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const rawState: State = this.seenStates.get( clientId )!;

					const isConnected = ! this.disconnectedUsers.has( clientId );
					const isMe = clientId === this.clientID;
					const myState: Partial< State > = isMe ? this.myThrottledState : {};
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
			if ( areMapsEqual( this.previousSnapshot, updatedStates, this.isStateEqual.bind( this ) ) ) {
				// Awareness state unchanged, do not update subscribers.
				return;
			}
		}

		// Update subscribers.
		this.previousSnapshot = updatedStates;
		this.stateSubscriptions.forEach( callback => {
			callback( Array.from( updatedStates.values() ) );
		} );
	}
}

