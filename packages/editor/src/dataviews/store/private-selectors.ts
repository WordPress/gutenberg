import { createSelector } from '@wordpress/data';
import type { State } from './reducer';

const EMPTY_ARRAY = [] as [];

export function getEntityActions( state: State, kind: string, name: string ) {
	return state.actions[ kind ]?.[ name ] ?? EMPTY_ARRAY;
}

export function getEntityFields( state: State, kind: string, name: string ) {
	return state.fields[ kind ]?.[ name ] ?? EMPTY_ARRAY;
}

/**
 * Returns the fields of an entity that a plugin registered with the public
 * `registerEntityField`, leaving out the defaults the editor registers.
 *
 * @param state Data state.
 * @param kind  Entity kind.
 * @param name  Entity name.
 * @return The fields, in registration order.
 */
export const getEntityPluginFields = createSelector(
	( state: State, kind: string, name: string ) => {
		const fields = getEntityFields( state, kind, name );
		const defaultIds = state.defaultFieldIds[ kind ]?.[ name ];
		if ( ! defaultIds ) {
			return fields;
		}
		const pluginFields = fields.filter(
			( field ) => ! defaultIds[ field.id ]
		);
		return pluginFields.length ? pluginFields : EMPTY_ARRAY;
	},
	( state: State, kind: string, name: string ) => [
		state.fields[ kind ]?.[ name ],
		state.defaultFieldIds[ kind ]?.[ name ],
	]
);

export function isEntityReady( state: State, kind: string, name: string ) {
	return state.isReady[ kind ]?.[ name ];
}
