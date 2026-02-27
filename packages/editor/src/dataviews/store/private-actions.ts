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
	featuredImageField,
	dateField,
	parentField,
	passwordField,
	commentStatusField,
	pingStatusField,
	discussionField,
	slugField,
	statusField,
	authorField,
	titleField,
	templateField,
	templateTitleField,
	pageTitleField,
	patternTitleField,
	notesField,
} from '@wordpress/fields';
import {
	altTextField,
	attachedToField,
	authorField as mediaAuthorField,
	captionField,
	dateAddedField,
	descriptionField,
	filenameField,
	filesizeField,
	mediaDimensionsField,
	mimeTypeField,
} from '@wordpress/media-fields';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { ATTACHMENT_POST_TYPE, DESIGN_POST_TYPES } from '../../store/constants';
import postPreviewField from '../fields/content-preview';
import { unlock } from '../../lock-unlock';

declare global {
	interface Window {
		__experimentalTemplateActivate?: boolean;
		__experimentalMediaEditor?: boolean;
	}
}

/**
 * Check if a post type supports editor notes.
 *
 * @param supports The post type supports object.
 * @return Whether editor notes are supported.
 */
function hasEditorNotesSupport( supports?: PostType[ 'supports' ] ): boolean {
	const editor = supports?.editor;
	if ( Array.isArray( editor ) ) {
		return !! editor[ 0 ]?.notes;
	}
	return false;
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
	dateAddedField,
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
	descriptionField,
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

		// Handle attachment post type separately with media-specific fields
		let fields;

		if ( postType === ATTACHMENT_POST_TYPE ) {
			fields = ORDERED_MEDIA_FIELDS;
		} else {
			fields = [
				postTypeConfig.supports?.thumbnail &&
					currentTheme?.theme_supports?.[ 'post-thumbnails' ] &&
					featuredImageField,
				postTypeConfig.supports?.author && authorField,
				statusField,
				! DESIGN_POST_TYPES.includes( postTypeConfig.slug ) &&
					dateField,
				slugField,
				postTypeConfig.supports?.[ 'page-attributes' ] && parentField,
				postTypeConfig.supports?.comments && commentStatusField,
				postTypeConfig.supports?.trackbacks && pingStatusField,
				( postTypeConfig.supports?.comments ||
					postTypeConfig.supports?.trackbacks ) &&
					discussionField,
				templateField,
				passwordField,
				postTypeConfig.supports?.editor &&
					postTypeConfig.viewable &&
					postPreviewField,
				hasEditorNotesSupport( postTypeConfig.supports ) && notesField,
			].filter( Boolean );
			if ( postTypeConfig.supports?.title ) {
				let _titleField;
				if ( postType === 'page' ) {
					_titleField = pageTitleField;
				} else if ( postType === 'wp_template' ) {
					_titleField = templateTitleField;
				} else if ( postType === 'wp_block' ) {
					_titleField = patternTitleField;
				} else {
					_titleField = titleField;
				}
				fields.push( _titleField );
			}
		}

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
