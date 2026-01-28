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
export class TypedAwareness< State extends object > extends Awareness {
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
 * An enhanced state includes additional metadata about the user's connection
 * that is not appropriate to synchronize via Yjs awareness.
 */
export type EnhancedState< State > = State & {
	clientId: number;
	isConnected: boolean;
	isMe: boolean;
};

export type EqualityFieldCheck< State, FieldName extends keyof State > = (
	value1?: State[ FieldName ],
	value2?: State[ FieldName ]
) => boolean;
