/**
 * External dependencies
 */
import { Awareness } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { getRecordValue } from './utils';

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
