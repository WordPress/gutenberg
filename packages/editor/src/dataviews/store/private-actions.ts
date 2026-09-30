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
	excerptField,
	featuredImageField,
	dateField,
	parentField,
	passwordField,
	pingStatusField,
	discussionField,
	slugField,
	statusField,
	templatePartAuthorField,
	titleField,
	templateField,
	templateTitleField,
	pageTitleField,
	patternTitleField,
	patternDescriptionField,
	patternSyncStatusField,
	scheduledDateField,
	lastEditedDateField,
	formatField,
	postContentInfoField,
	stickyField,
	descriptionField,
	readOnlyDescriptionField,
	postsPerPageField,
	siteDiscussionField,
	postsPageTitleField,
} from '@wordpress/fields';
import {
	altTextField,
	attachedToField,
	authorField as mediaAuthorField,
	captionField,
	descriptionField as mediaDescriptionField,
	filenameField,
	filesizeField,
	mediaDimensionsField,
	mimeTypeField,
} from '@wordpress/media-fields';
import { store as editorStore } from '../../store';
import { ATTACHMENT_POST_TYPE, DESIGN_POST_TYPES } from '../../store/constants';
import postPreviewField from '../fields/content-preview';
import { unlock } from '../../lock-unlock';
import { mergeServerFields } from './merge-server-fields';

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

/*
 * Media fields for the attachment post type.
 *
 * Field order follows a logical grouping:
 * 1. Metadata fields in panels (date, author, file info)
 * 2. Core editable fields (title, alt text, caption, description)
 *
 * Note: media_thumbnail is not included as it's shown in the canvas preview
 */
const ORDERED_MEDIA_FIELDS = [
	// Metadata in panels (collapsed by default).
	'date',
	mediaAuthorField,
	filenameField,
	mimeTypeField,
	filesizeField,
	mediaDimensionsField,
	attachedToField,
	// Regular layout fields (always visible).
	titleField,
	altTextField,
	captionField,
	mediaDescriptionField,
];

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
		const { disablePostFormats } = registry
			.select( editorStore )
			.getEditorSettings();

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

		// Handle attachment post type separately with media-specific fields.
		// A string is the id of a field registered on the server, placed
		// where it goes, see `mergeServerFields()`.
		let fields;

		if ( postType === ATTACHMENT_POST_TYPE ) {
			fields = ORDERED_MEDIA_FIELDS;
		} else {
			const postTypeSlug = postTypeConfig.slug;
			const isDesignPostType = DESIGN_POST_TYPES.includes( postTypeSlug );
			const isPattern = postTypeSlug === 'wp_block';
			// `post-thumbnails` is `true` or the list of post types the theme
			// opted in.
			const postThumbnails =
				currentTheme?.theme_supports?.[ 'post-thumbnails' ];
			const themeSupportsThumbnails = Array.isArray( postThumbnails )
				? postThumbnails.includes( postTypeSlug )
				: !! postThumbnails;

			fields = [
				postTypeConfig.supports?.thumbnail &&
					themeSupportsThumbnails &&
					featuredImageField,
				// The author field of the post types supporting authors is
				// registered on the server, templates getting their own
				// there. Template parts unregister it there and keep their
				// own.
				'author',
				postTypeSlug === 'wp_template_part' && templatePartAuthorField,
				! isDesignPostType && statusField,
				! isDesignPostType && dateField,
				! isDesignPostType && scheduledDateField,
				lastEditedDateField,
				// There is no post type support flag for permalinks, and
				// `viewable` alone is not the full condition (the type must
				// also be public), so the field also checks each post.
				! isDesignPostType && postTypeConfig.viewable && slugField,
				! isDesignPostType &&
					postTypeConfig.supports?.excerpt &&
					excerptField,
				isPattern &&
					postTypeConfig.supports?.excerpt &&
					patternDescriptionField,
				postTypeConfig.supports?.[ 'page-attributes' ] && parentField,
				'comment_status',
				postTypeConfig.supports?.trackbacks && pingStatusField,
				( postTypeConfig.supports?.comments ||
					postTypeConfig.supports?.trackbacks ) &&
					discussionField,
				! isDesignPostType && templateField,
				postTypeConfig.supports?.[ 'post-formats' ] &&
					! disablePostFormats &&
					formatField,
				( ! isDesignPostType || isPattern ) &&
					postTypeConfig.supports?.editor &&
					postContentInfoField,
				! isDesignPostType && passwordField,
				postTypeSlug === 'post' && stickyField,
				postTypeSlug === 'wp_template' && descriptionField,
				postTypeSlug === 'wp_template' && readOnlyDescriptionField,
				// The `home`/`index` template summary exposes a few fields that
				// target other entities (`root/site` and the posts page).
				// `DataFormPostSummary` overrides them to read/write the right
				// entity and to control their visibility.
				postTypeSlug === 'wp_template' && postsPageTitleField,
				postTypeSlug === 'wp_template' && postsPerPageField,
				postTypeSlug === 'wp_template' && siteDiscussionField,
				postTypeConfig.supports?.editor &&
					postTypeConfig.viewable &&
					postPreviewField,
				'notesCount',
				isPattern && patternSyncStatusField,
			].filter( Boolean );
			if ( postTypeConfig.supports?.title ) {
				let _titleField;
				if ( postType === 'page' ) {
					_titleField = pageTitleField;
				} else if ( postType === 'wp_template' ) {
					_titleField = templateTitleField;
				} else if (
					[ 'wp_block', 'wp_template_part' ].includes( postType )
				) {
					_titleField = patternTitleField;
				} else {
					_titleField = titleField;
				}
				fields.push( _titleField );
			}
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
		const mergedFields = mergeServerFields(
			fields as Array< Field< any > | string >,
			serverFields
		);

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
