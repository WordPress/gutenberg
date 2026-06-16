/**
 * Internal dependencies
 */
import type { FieldCollection } from './types';

/**
 * Action to receive field collections data.
 *
 * @param kind        The entity kind (e.g., 'postType', 'taxonomy').
 * @param name        The specific entity name (e.g., 'post', 'category').
 * @param collections Array of field collections associated with the entity.
 * @return Action object.
 */
export function receiveEntityFieldCollections< T >(
	kind: string,
	name: string,
	collections: FieldCollection< T >[]
) {
	return {
		type: 'RECEIVE_ENTITY_FIELD_COLLECTIONS',
		kind,
		name,
		collections,
	} as const;
}

export type Action = ReturnType< typeof receiveEntityFieldCollections >;
