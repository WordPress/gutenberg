import { store as coreStore } from '@wordpress/core-data';
import type { Action, Field } from '@wordpress/dataviews';
import { doAction } from '@wordpress/hooks';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { resolveActionsConfig } from '../actions-loader/resolve-actions-config';
import type { ActionsConfig } from '../actions-loader/resolve-actions-config';

export function registerEntityAction< Item >(
	kind: string,
	name: string,
	config: Action< Item >
) {
	return {
		type: 'REGISTER_ENTITY_ACTION' as const,
		kind,
		name,
		config,
	};
}

export function unregisterEntityAction(
	kind: string,
	name: string,
	actionId: string
) {
	return {
		type: 'UNREGISTER_ENTITY_ACTION' as const,
		kind,
		name,
		actionId,
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

export function setIsReady( kind: string, name: string ) {
	return {
		type: 'SET_IS_READY' as const,
		kind,
		name,
	};
}

/**
 * Registers the actions of a post type, once: the actions registered on the
 * server, as the `/wp/v2/entity-actions` route returns them through the
 * private `getActionsConfig` selector of the core data store, with the
 * JavaScript parts of their script modules merged in. Then fires
 * `core.registerPostTypeSchema`, for plugins to register their own actions.
 *
 * Which actions a post type gets is decided on the server. When the request
 * fails, the post type gets no server action, and the hook still fires.
 *
 * @param postType The post type.
 */
export const registerPostTypeSchema =
	( postType: string ) =>
	async ( { registry }: { registry: any } ) => {
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

		let actions: Action< any >[] = [];
		try {
			const config: ActionsConfig | undefined = await unlock(
				registry.resolveSelect( coreStore )
			).getActionsConfig( 'postType', postType );
			actions = config ? await resolveActionsConfig( config ) : [];
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Could not load the actions of the ${ postType } post type.`,
				error
			);
		}

		registry.batch( () => {
			actions.forEach( ( action ) => {
				unlock( registry.dispatch( editorStore ) ).registerEntityAction(
					'postType',
					postType,
					action
				);
			} );
		} );

		doAction( 'core.registerPostTypeSchema', postType );
	};
