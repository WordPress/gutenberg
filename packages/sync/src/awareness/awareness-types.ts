import { Awareness } from 'y-protocols/awareness';

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
 * This base state represents the presence of the user. We expect it to be
 * extended to include additional state describing the user's current activity.
 * This state must be serializable and compact.
 *
 * TODO: Add in the user information.
 */
export interface BaseState {}

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

/**
 * The post editor state extends the base state with information used to render
 * presence indicators in the post editor.
 *
 * TODO: Add in the presence indicators.
 */
export interface PostEditorState extends BaseState {}
