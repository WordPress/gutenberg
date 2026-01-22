/**
 * External dependencies
 */
import { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import { getRecordValue } from '../utils';

/**
 * Extended Awareness class with typed state accessors.
 */
export class TypedAwareness< State extends BaseState > extends Awareness {
	/**
	 * Get the states from an awareness document.
	 */
	public getStates(): Map< number, State > {
		return super.getStates() as Map< number, State >;
	}

	/**
	 * Get a local state field from an awareness document.
	 * @param field
	 */
	public getLocalStateField< FieldName extends keyof State >(
		field: FieldName
	): State[ FieldName ] | null {
		const state: State | null = this.getLocalState() as State | null;
		return getRecordValue< State, FieldName >( state, field );
	}

	/**
	 * Set a local state field on an awareness document.
	 * @param field
	 * @param value
	 */
	public setLocalStateField< FieldName extends string & keyof State >(
		field: FieldName,
		value: State[ FieldName ]
	): void {
		super.setLocalStateField( field, value );
	}
}

/**
 * This base user info is a subset of the User interface from @wordpress/core-data.
 *
 * In order to avoid circular dependencies, we define it here instead of importing
 * the User interface from @wordpress/core-data.
 *
 * The avatarUrl is an additional field that is not part of the User interface.
 */
export interface WordPressUserInfo {
	id: number;
	name: string;
	slug: string;
	avatar_urls: Record< string, string >;
}

/**
 * The user info interface extends the base user info with additional fields used for presence
 * indicators.
 */
export interface UserInfo extends WordPressUserInfo {
	browserType: string;
	color: string;
	enteredAt: number;
}

/**
 * This base state represents the presence of the user. We expect it to be
 * extended to include additional state describing the user's current activity.
 * This state must be serializable and compact.
 */
export interface BaseState {
	userInfo: UserInfo;
}

/**
 * An enhanced state includes additional metadata about the user's connection
 * that is not appropriate to synchronize via Yjs awareness.
 */
export type EnhancedState< State extends BaseState > = State & {
	clientId: number;
	isConnected: boolean;
	isMe: boolean;
};

export type EqualityFieldCheck<
	State extends BaseState,
	FieldName extends keyof State,
> = ( value1?: State[ FieldName ], value2?: State[ FieldName ] ) => boolean;
