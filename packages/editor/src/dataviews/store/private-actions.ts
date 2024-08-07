/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import type { Action } from '@wordpress/dataviews';
import { doAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import deletePost from '../actions/delete-post';
import exportPattern from '../actions/export-pattern';
import resetPost from '../actions/reset-post';
import trashPost from '../actions/trash-post';
import permanentlyDeletePost from '../actions/permanently-delete-post';
import restorePost from '../actions/restore-post';
import type { PostType } from '../types';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

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

export function setIsReady( kind: string, name: string ) {
	return {
		type: 'SET_IS_READY' as const,
		kind,
		name,
	};
}

export const registerPostTypeActions =
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

		const postTypeConfig = ( await registry
			.resolveSelect( coreStore )
			.getPostType( postType ) ) as PostType;

		const actions = [
			postTypeConfig.slug === 'wp_block' ? exportPattern : undefined,
			resetPost,
			restorePost,
			deletePost,
			trashPost,
			permanentlyDeletePost,
		];

		registry.batch( () => {
			actions.forEach( ( action ) => {
				if ( action === undefined ) {
					return;
				}
				unlock( registry.dispatch( editorStore ) ).registerEntityAction(
					'postType',
					postType,
					action
				);
			} );
		} );

		doAction( 'core.registerPostTypeActions', postType );
	};
