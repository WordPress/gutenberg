import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import type { Action, Field } from '@wordpress/dataviews';
import { doAction } from '@wordpress/hooks';
import type { PostType } from '@wordpress/fields';
import { addQueryArgs } from '@wordpress/url';
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
	templateAuthorField,
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

/**
 * A field as the server exposes it: the serializable subset of the Field
 * API, see `Gutenberg_REST_Fields_Controller_7_2::get_field_schema()`.
 */
type ServerField< Item > = Pick< Field< Item >, 'id' > &
	Partial< Omit< Field< Item >, 'id' > >;

/**
 * The response of the `wp/v2/fields` route.
 */
interface ServerFieldsResponse< Item > {
	kind: string;
	name: string;
	fields: ServerField< Item >[];
	script_modules: {
		id: string;
		fields: string[];
	}[];
}

/**
 * Loads the fields registered on the server for an entity.
 *
 * Fetches the definitions from the `wp/v2/fields` route and imports the
 * script modules registered along with them.
 *
 * @param kind The entity kind (e.g. `postType`).
 * @param name The entity name (e.g. `page`).
 * @return The fields, in registration order, with their JavaScript parts.
 */
async function loadServerFields< Item >(
	kind: string,
	name: string
): Promise< Field< Item >[] > {
	let response: ServerFieldsResponse< Item >;
	try {
		response = await apiFetch< ServerFieldsResponse< Item > >( {
			path: addQueryArgs( '/wp/v2/fields', { kind, name } ),
		} );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn(
			`Could not load the fields of ${ kind }/${ name } from the server.`,
			error
		);
		return [];
	}

	// The JavaScript parts of each field, by field id, in module order.
	const scriptParts = new Map< string, Partial< Field< Item > > >();
	await Promise.all(
		( response.script_modules ?? [] ).map(
			async ( { id: moduleId, fields: fieldIds } ) => {
				let module;
				try {
					module = await import(
						/* webpackIgnore: true */ /* @vite-ignore */ moduleId
					);
				} catch ( error ) {
					// eslint-disable-next-line no-console
					console.warn(
						`Could not load the script module ${ moduleId } of the fields of ${ kind }/${ name }.`,
						error
					);
					return;
				}

				const parts = module?.default ?? {};
				/*
				 * Iterate over the registered field ids.
				 * The parts augment the registered fields,
				 * they don't contain a full field definition.
				 *
				 * If we don't check for the field id,
				 * we may end up with a field that has been unregistered on the server,
				 * but whose script module is still loaded.
				 */
				for ( const fieldId of fieldIds ?? [] ) {
					if ( parts[ fieldId ] ) {
						scriptParts.set( fieldId, {
							...scriptParts.get( fieldId ),
							...parts[ fieldId ],
						} );
					}
				}
			}
		)
	);

	return ( response.fields ?? [] ).map(
		( field ) =>
			( {
				...field,
				...scriptParts.get( field.id ),
			} ) as Field< Item >
	);
}

/**
 * Merges the fields registered on the server into the fields the editor
 * derives itself.
 *
 * A server field with the id of a client field overrides its properties,
 * keeping its position, so the data the server declares (label, type,
 * elements, filter operators…) wins while the client keeps providing the
 * JavaScript parts the server does not ship. A server field the client does
 * not know about is appended, in registration order.
 *
 * @param clientFields The fields the editor derives.
 * @param serverFields The fields registered on the server.
 * @return The merged fields.
 */
function mergeServerFields< Item >(
	clientFields: Field< Item >[],
	serverFields: Field< Item >[]
): Field< Item >[] {
	const serverFieldsById = new Map(
		serverFields.map( ( field ) => [ field.id, field ] )
	);

	const merged = clientFields.map( ( field ) => {
		const serverField = serverFieldsById.get( field.id );
		if ( ! serverField ) {
			return field;
		}
		serverFieldsById.delete( field.id );
		return { ...field, ...serverField };
	} );

	return [ ...merged, ...serverFieldsById.values() ];
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
	// Metadata in panels (collapsed by default). The date added field is
	// registered on the server.
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
		const serverFieldsPromise = loadServerFields( 'postType', postType );

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

		// Handle attachment post type separately with media-specific fields
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
				// registered on the server; templates and template parts
				// unregister it there and keep their own.
				postTypeSlug === 'wp_template' && templateAuthorField,
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
				// The comment status field is registered on the server.
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
				// The notes field is registered on the server.
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

		fields = mergeServerFields(
			fields as Field< any >[],
			await serverFieldsPromise
		);

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
