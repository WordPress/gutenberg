import type { Action, Field } from '@wordpress/dataviews';

/**
 * Receives the actions of an entity, as the `getEntityActions` resolver
 * resolves them from the server.
 *
 * @param kind    Entity kind.
 * @param name    Entity name.
 * @param actions The actions.
 * @return Action object.
 */
export function receiveEntityActions< Item >(
	kind: string,
	name: string,
	actions: Action< Item >[]
) {
	return {
		type: 'RECEIVE_ENTITY_ACTIONS' as const,
		kind,
		name,
		actions,
	};
}

/**
 * Receives the fields of an entity, as the `getEntityFields` resolver
 * resolves them from the server.
 *
 * @param kind   Entity kind.
 * @param name   Entity name.
 * @param fields The fields.
 * @return Action object.
 */
export function receiveEntityFields< Item >(
	kind: string,
	name: string,
	fields: Field< Item >[]
) {
	return {
		type: 'RECEIVE_ENTITY_FIELDS' as const,
		kind,
		name,
		fields,
	};
}
