import { store as coreStore } from '@wordpress/core-data';
import type { Action, Field } from '@wordpress/dataviews';
import { doAction } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { PostType } from '@wordpress/fields';
import { loadFields } from '@wordpress/fields-loader';
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
	featuredImageField,
	templateField,
} from '@wordpress/fields';
import { store as editorStore } from '../../store';
import { ATTACHMENT_POST_TYPE, DESIGN_POST_TYPES } from '../../store/constants';
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

		// Runs in parallel with the lookups below; awaited once the client
		// fields are known.
		const serverFieldsPromise = loadFields( {
			kind: 'postType',
			name: postType,
		} );

		const postTypeConfig = ( await registry
			.resolveSelect( coreStore )
			.getPostType( postType ) ) as PostType;

		const canCreate = await registry
			.resolveSelect( coreStore )
			.canUser( 'create', {
				kind: 'postType',
				name: postType,
			} );
		const currentTheme = await registry
			.resolveSelect( coreStore )
			.getCurrentTheme();

		let canDuplicate =
			! [ 'wp_block', 'wp_template_part', 'wp_template' ].includes(
				postTypeConfig.slug
			) &&
			canCreate &&
			duplicatePost;

		// @ts-expect-error `globalThis` has no index signature for this build-time global.
		if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
			// Outside Gutenberg, disable duplication.
			canDuplicate = undefined;
		}

		const actions = [
			postTypeConfig.viewable ? viewPost : undefined,
			!! postTypeConfig.supports?.revisions
				? viewPostRevisions
				: undefined,
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

		// The editor adds its derived fields after the fields registered on
		// the server. Attachments get only the fields of the `attachment`
		// collection, which the media editor lays out in its own order.
		let fields: Field< any >[] = [];

		if ( postType !== ATTACHMENT_POST_TYPE ) {
			const postTypeSlug = postTypeConfig.slug;
			const isDesignPostType = DESIGN_POST_TYPES.includes( postTypeSlug );
			// `post-thumbnails` is `true` or the list of post types the theme
			// opted in.
			const postThumbnails =
				currentTheme?.theme_supports?.[ 'post-thumbnails' ];
			const themeSupportsThumbnails = Array.isArray( postThumbnails )
				? postThumbnails.includes( postTypeSlug )
				: !! postThumbnails;

			fields = [
				// This field uses the editor's featured image and media picker
				// hooks, which depend on editor context.
				postTypeConfig.supports?.thumbnail &&
					themeSupportsThumbnails &&
					featuredImageField,
				// The template field uses private core-data selectors via
				// @wordpress/fields' unlock, which needs resolving before it can
				// move to @wordpress/core-fields.
				! isDesignPostType && templateField,
			].filter( Boolean ) as Field< any >[];
		}

		let serverFields: Field< any >[] = [];
		try {
			serverFields = await serverFieldsPromise;
		} catch {
			// The fields ported to the server go missing; say so rather than
			// letting the screen look as if they did not exist.
			registry
				.dispatch( noticesStore )
				.createErrorNotice(
					__(
						"Some fields couldn't be loaded, so they're missing from this screen. Reload the page to try again."
					),
					{ id: 'editor-entity-fields-error', type: 'snackbar' }
				);
		}
		const serverFieldIds = new Set(
			serverFields.map( ( field ) => field.id )
		);
		const mergedFields = [
			...serverFields,
			...fields.filter( ( field ) => ! serverFieldIds.has( field.id ) ),
		];

		registry.batch( () => {
			actions.forEach( ( action ) => {
				unlock( registry.dispatch( editorStore ) ).registerEntityAction(
					'postType',
					postType,
					action
				);
			} );
			mergedFields.forEach( ( field ) => {
				unlock( registry.dispatch( editorStore ) ).registerEntityField(
					'postType',
					postType,
					field
				);
			} );
		} );

		doAction( 'core.registerPostTypeSchema', postType );
	};
