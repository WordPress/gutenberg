import type { Field } from '@wordpress/dataviews';
import { doAction } from '@wordpress/hooks';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

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

export function setIsReady( kind: string, name: string ) {
	return {
		type: 'SET_IS_READY' as const,
		kind,
		name,
	};
}

/**
 * Fires the `core.registerPostTypeSchema` hook once for each post type.
 *
 * The fields and the actions of a post type come from the server, so there
 * is nothing left to register here. The hook still fires for the code that
 * listens to it.
 *
 * @param postType The post type.
 */
export const registerPostTypeSchema =
	( postType: string ) =>
	( { registry }: { registry: any } ) => {
		const isReady = unlock( registry.select( editorStore ) ).isEntityReady(
			'postType',
			postType
		);
		if ( isReady ) {
			return;
		}

		unlock( registry.dispatch( editorStore ) ).setIsReady(
			'postType',
			postType
		);

		doAction( 'core.registerPostTypeSchema', postType );
	};
