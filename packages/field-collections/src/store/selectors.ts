/**
 * Internal dependencies
 */
import type { FieldCollection, State } from './types';

/**
 * Selector to get field collections for a specific entity kind and name.
 *
 * @param state Current state.
 * @param kind  Entity kind (e.g., 'postType', 'taxonomy').
 * @param name  Entity name (e.g., 'post', 'category').
 * @return Array of field collections for the specified entity.
 */
export function getEntityFieldCollections< T >(
	state: State,
	kind: string,
	name: string
): FieldCollection< T >[] {
	const key = `${ kind }-${ name }`;
	return state.fieldCollections[ key ] || [];
}
