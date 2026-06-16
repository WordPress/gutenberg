/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import type { Action, Field } from '@wordpress/dataviews';
import { doAction } from '@wordpress/hooks';
import type { PostType } from '@wordpress/fields';
import {
	viewPost,
	viewPostRevisions,
	duplicatePost,
	duplicatePattern,
	reorderPage,
	exportPattern,
	permanentlyDeletePost,
	restorePost,
	trashPost,
	renamePost,
	resetPost,
	deletePost,
	duplicateTemplatePart,
} from '@wordpress/fields';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import postPreviewField from '../fields/content-preview';
import { unlock } from '../../lock-unlock';

declare global {
	interface Window {
		__experimentalTemplateActivate?: boolean;
	}
}

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

export function registerEntityField< Item >(
	kind: string,
	name: string,
	config: Field< Item >
) {
	return {
		type: 'REGISTER_ENTITY_FIELD' as const,
		kind,
		name,
		config,
	};
}

export function unregisterEntityField(
	kind: string,
	name: string,
	fieldId: string
) {
	return {
		type: 'UNREGISTER_ENTITY_FIELD' as const,
		kind,
		name,
		fieldId,
	};
}

export function setIsReady( kind: string, name: string ) {
	return {
		type: 'SET_IS_READY' as const,
		kind,
		name,
	};
}

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

		const postTypeConfig = ( await registry
			.resolveSelect( coreStore )
			.getPostType( postType ) ) as PostType;

		const [ canCreate, currentTheme ] = await Promise.all( [
			registry.resolveSelect( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: postType,
			} ),
			registry.resolveSelect( coreStore ).getCurrentTheme(),
		] );
		let canDuplicate =
			! [ 'wp_block', 'wp_template_part' ].includes(
				postTypeConfig.slug
			) &&
			canCreate &&
			duplicatePost;

		// @ts-ignore
		if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
			// Outside Gutenberg, disable duplication except for wp_template.
			if ( 'wp_template' !== postTypeConfig.slug ) {
				canDuplicate = undefined;
			}
		}

		// When template activation experiment is disabled, templates cannot be duplicated.
		// @ts-ignore
		if (
			postTypeConfig.slug === 'wp_template' &&
			! window?.__experimentalTemplateActivate
		) {
			canDuplicate = undefined;
		}

		const actions = [
			postTypeConfig.viewable ? viewPost : undefined,
			!! postTypeConfig.supports?.revisions
				? viewPostRevisions
				: undefined,
			// @ts-ignore
			canDuplicate,
			postTypeConfig.slug === 'wp_template_part' &&
			canCreate &&
			currentTheme?.is_block_theme
				? duplicateTemplatePart
				: undefined,
			canCreate && postTypeConfig.slug === 'wp_block'
				? duplicatePattern
				: undefined,
			postTypeConfig.supports?.title ? renamePost : undefined,
			postTypeConfig.supports?.[ 'page-attributes' ]
				? reorderPage
				: undefined,
			postTypeConfig.slug === 'wp_block' ? exportPattern : undefined,
			restorePost,
			resetPost,
			deletePost,
			trashPost,
			permanentlyDeletePost,
		].filter( Boolean );

		// The serializable field definitions and their non-serializable
		// extensions are provided by the field collections registered
		// server-side, and merged client-side by `useFieldCollections` from
		// `@wordpress/field-collections`. The preview field is the exception:
		// it cannot move there because its render depends on editor internals
		// (EditorProvider, global styles, the editor store) that the
		// collections' script modules cannot import, so it is registered in the
		// editor store here and combined with the collection fields by the
		// `usePostFields` consumer.
		const fields = [
			postTypeConfig.supports?.editor &&
				postTypeConfig.viewable &&
				postPreviewField,
		].filter( Boolean );

		registry.batch( () => {
			actions.forEach( ( action ) => {
				unlock( registry.dispatch( editorStore ) ).registerEntityAction(
					'postType',
					postType,
					action
				);
			} );
			fields.forEach( ( field ) => {
				unlock( registry.dispatch( editorStore ) ).registerEntityField(
					'postType',
					postType,
					field
				);
			} );
		} );

		doAction( 'core.registerPostTypeSchema', postType );
	};
