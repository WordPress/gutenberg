/**
 * WordPress dependencies
 */
import {
	getFreeformContentHandlerName,
	getDefaultBlockName,
	__unstableSerializeAndClean,
	parse,
} from '@wordpress/blocks';
import { isInTheFuture, getDate } from '@wordpress/date';
import { addQueryArgs, cleanForSlug } from '@wordpress/url';
import { createSelector, createRegistrySelector } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { Platform } from '@wordpress/element';
import { layout } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import {
	EDIT_MERGE_PROPERTIES,
	PERMALINK_POSTNAME_REGEX,
	ONE_MINUTE_IN_MS,
	AUTOSAVE_PROPERTIES,
} from './constants';
import { getPostRawValue } from './reducer';
import { getTemplatePartIcon } from '../utils/get-template-part-icon';
import { unlock } from '../lock-unlock';

/**
 * Shared reference to an empty object for cases where it is important to avoid
 * returning a new object reference on every invocation, as in a connected or
 * other pure component which performs `shouldComponentUpdate` check on props.
 * This should be used as a last resort, since the normalized data should be
 * maintained by the reducer result in state.
 */
const EMPTY_OBJECT = {};

/**
 * Returns true if any past editor history snapshots exist, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether undo history exists.
 */
export const hasEditorUndo = createRegistrySelector( ( select ) => () => {
	return select( coreStore ).hasUndo();
} );

/**
 * Returns true if any future editor history snapshots exist, or false
 * otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether redo history exists.
 */
export const hasEditorRedo = createRegistrySelector( ( select ) => () => {
	return select( coreStore ).hasRedo();
} );

/**
 * Returns true if the currently edited post is yet to be saved, or false if
 * the post has been saved.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post is new.
 */
export function isEditedPostNew( state ) {
	return getCurrentPost( state ).status === 'auto-draft';
}

/**
 * Returns true if content includes unsaved changes, or false otherwise.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether content includes unsaved changes.
 */
export function hasChangedContent( state ) {
	const edits = getPostEdits( state );
	return 'content' in edits;
}

/**
 * Returns true if there are unsaved values for the current edit session, or
 * false if the editing state matches the saved or new post.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether unsaved values exist.
 */
export const isEditedPostDirty = createRegistrySelector(
	( select ) => ( state ) => {
		// Edits should contain only fields which differ from the saved post (reset
		// at initial load and save complete). Thus, a non-empty edits state can be
		// inferred to contain unsaved values.
		const postType = getCurrentPostType( state );
		const postId = getCurrentPostId( state );
		return select( coreStore ).hasEditsForEntityRecord(
			'postType',
			postType,
			postId
		);
	}
);

/**
 * Returns true if there are unsaved edits for entities other than
 * the editor's post, and false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether there are edits or not.
 */
export const hasNonPostEntityChanges = createRegistrySelector(
	( select ) => ( state ) => {
		const dirtyEntityRecords =
			select( coreStore ).__experimentalGetDirtyEntityRecords();
		const { type, id } = getCurrentPost( state );
		return dirtyEntityRecords.some(
			( entityRecord ) =>
				entityRecord.kind !== 'postType' ||
				entityRecord.name !== type ||
				entityRecord.key !== id
		);
	}
);

/**
 * Returns true if there are no unsaved values for the current edit session and
 * if the currently edited post is new (has never been saved before).
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether new post and unsaved values exist.
 */
export function isCleanNewPost( state ) {
	return ! isEditedPostDirty( state ) && isEditedPostNew( state );
}

/**
 * Returns the post currently being edited in its last known saved state, not
 * including unsaved edits. Returns an object containing relevant default post
 * values if the post has not yet been saved.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Post object.
 */
export const getCurrentPost = createRegistrySelector(
	( select ) => ( state ) => {
		const postId = getCurrentPostId( state );
		const postType = getCurrentPostType( state );

		const post = select( coreStore ).getRawEntityRecord(
			'postType',
			postType,
			postId
		);
		if ( post ) {
			return post;
		}

		// This exists for compatibility with the previous selector behavior
		// which would guarantee an object return based on the editor reducer's
		// default empty object state.
		return EMPTY_OBJECT;
	}
);

/**
 * Returns the post type of the post currently being edited.
 *
 * @param {Object} state Global application state.
 *
 * @example
 *
 *```js
 * const currentPostType = wp.data.select( 'core/editor' ).getCurrentPostType();
 *```
 * @return {string} Post type.
 */
export function getCurrentPostType( state ) {
	return state.postType;
}

/**
 * Returns the ID of the post currently being edited, or null if the post has
 * not yet been saved.
 *
 * @param {Object} state Global application state.
 *
 * @return {?number} ID of current post.
 */
export function getCurrentPostId( state ) {
	return state.postId;
}

/**
 * Returns the template ID currently being rendered/edited
 *
 * @param {Object} state Global application state.
 *
 * @return {string?} Template ID.
 */
export function getCurrentTemplateId( state ) {
	return state.templateId;
}

/**
 * Returns the number of revisions of the post currently being edited.
 *
 * @param {Object} state Global application state.
 *
 * @return {number} Number of revisions.
 */
export function getCurrentPostRevisionsCount( state ) {
	return (
		getCurrentPost( state )._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0
	);
}

/**
 * Returns the last revision ID of the post currently being edited,
 * or null if the post has no revisions.
 *
 * @param {Object} state Global application state.
 *
 * @return {?number} ID of the last revision.
 */
export function getCurrentPostLastRevisionId( state ) {
	return (
		getCurrentPost( state )._links?.[ 'predecessor-version' ]?.[ 0 ]?.id ??
		null
	);
}

/**
 * Returns any post values which have been changed in the editor but not yet
 * been saved.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Object of key value pairs comprising unsaved edits.
 */
export const getPostEdits = createRegistrySelector( ( select ) => ( state ) => {
	const postType = getCurrentPostType( state );
	const postId = getCurrentPostId( state );
	return (
		select( coreStore ).getEntityRecordEdits(
			'postType',
			postType,
			postId
		) || EMPTY_OBJECT
	);
} );

/**
 * Returns an attribute value of the saved post.
 *
 * @param {Object} state         Global application state.
 * @param {string} attributeName Post attribute name.
 *
 * @return {*} Post attribute value.
 */
export function getCurrentPostAttribute( state, attributeName ) {
	switch ( attributeName ) {
		case 'type':
			return getCurrentPostType( state );

		case 'id':
			return getCurrentPostId( state );

		default:
			const post = getCurrentPost( state );
			if ( ! post.hasOwnProperty( attributeName ) ) {
				break;
			}

			return getPostRawValue( post[ attributeName ] );
	}
}

/**
 * Returns a single attribute of the post being edited, preferring the unsaved
 * edit if one exists, but merging with the attribute value for the last known
 * saved state of the post (this is needed for some nested attributes like meta).
 *
 * @param {Object} state         Global application state.
 * @param {string} attributeName Post attribute name.
 *
 * @return {*} Post attribute value.
 */
const getNestedEditedPostProperty = createSelector(
	( state, attributeName ) => {
		const edits = getPostEdits( state );
		if ( ! edits.hasOwnProperty( attributeName ) ) {
			return getCurrentPostAttribute( state, attributeName );
		}

		return {
			...getCurrentPostAttribute( state, attributeName ),
			...edits[ attributeName ],
		};
	},
	( state, attributeName ) => [
		getCurrentPostAttribute( state, attributeName ),
		getPostEdits( state )[ attributeName ],
	]
);

/**
 * Returns a single attribute of the post being edited, preferring the unsaved
 * edit if one exists, but falling back to the attribute for the last known
 * saved state of the post.
 *
 * @param {Object} state         Global application state.
 * @param {string} attributeName Post attribute name.
 *
 * @example
 *
 *```js
 * 	// Get specific media size based on the featured media ID
 * 	// Note: change sizes?.large for any registered size
 * 	const getFeaturedMediaUrl = useSelect( ( select ) => {
 * 		const getFeaturedMediaId =
 * 			select( 'core/editor' ).getEditedPostAttribute( 'featured_media' );
 * 		const getMedia = select( 'core' ).getMedia( getFeaturedMediaId );
 *
 * 		return (
 * 			getMedia?.media_details?.sizes?.large?.source_url || getMedia?.source_url || ''
 * 		);
 * }, [] );
 *```
 *
 * @return {*} Post attribute value.
 */
export function getEditedPostAttribute( state, attributeName ) {
	// Special cases.
	switch ( attributeName ) {
		case 'content':
			return getEditedPostContent( state );
	}

	// Fall back to saved post value if not edited.
	const edits = getPostEdits( state );
	if ( ! edits.hasOwnProperty( attributeName ) ) {
		return getCurrentPostAttribute( state, attributeName );
	}

	// Merge properties are objects which contain only the patch edit in state,
	// and thus must be merged with the current post attribute.
	if ( EDIT_MERGE_PROPERTIES.has( attributeName ) ) {
		return getNestedEditedPostProperty( state, attributeName );
	}

	return edits[ attributeName ];
}

/**
 * Returns an attribute value of the current autosave revision for a post, or
 * null if there is no autosave for the post.
 *
 * @deprecated since 5.6. Callers should use the `getAutosave( postType, postId, userId )` selector
 * 			   from the '@wordpress/core-data' package and access properties on the returned
 * 			   autosave object using getPostRawValue.
 *
 * @param {Object} state         Global application state.
 * @param {string} attributeName Autosave attribute name.
 *
 * @return {*} Autosave attribute value.
 */
export const getAutosaveAttribute = createRegistrySelector(
	( select ) => ( state, attributeName ) => {
		if (
			! AUTOSAVE_PROPERTIES.includes( attributeName ) &&
			attributeName !== 'preview_link'
		) {
			return;
		}

		const postType = getCurrentPostType( state );

		// Currently template autosaving is not supported.
		if ( postType === 'wp_template' ) {
			return false;
		}

		const postId = getCurrentPostId( state );
		const currentUserId = select( coreStore ).getCurrentUser()?.id;
		const autosave = select( coreStore ).getAutosave(
			postType,
			postId,
			currentUserId
		);

		if ( autosave ) {
			return getPostRawValue( autosave[ attributeName ] );
		}
	}
);

/**
 * Returns the current visibility of the post being edited, preferring the
 * unsaved value if different than the saved post. The return value is one of
 * "private", "password", or "public".
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Post visibility.
 */
export function getEditedPostVisibility( state ) {
	const status = getEditedPostAttribute( state, 'status' );
	if ( status === 'private' ) {
		return 'private';
	}

	const password = getEditedPostAttribute( state, 'password' );
	if ( password ) {
		return 'password';
	}

	return 'public';
}

/**
 * Returns true if post is pending review.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether current post is pending review.
 */
export function isCurrentPostPending( state ) {
	return getCurrentPost( state ).status === 'pending';
}

/**
 * Return true if the current post has already been published.
 *
 * @param {Object}  state       Global application state.
 * @param {Object?} currentPost Explicit current post for bypassing registry selector.
 *
 * @return {boolean} Whether the post has been published.
 */
export function isCurrentPostPublished( state, currentPost ) {
	const post = currentPost || getCurrentPost( state );

	return (
		[ 'publish', 'private' ].indexOf( post.status ) !== -1 ||
		( post.status === 'future' &&
			! isInTheFuture(
				new Date( Number( getDate( post.date ) ) - ONE_MINUTE_IN_MS )
			) )
	);
}

/**
 * Returns true if post is already scheduled.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether current post is scheduled to be posted.
 */
export function isCurrentPostScheduled( state ) {
	return (
		getCurrentPost( state ).status === 'future' &&
		! isCurrentPostPublished( state )
	);
}

/**
 * Return true if the post being edited can be published.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post can been published.
 */
export function isEditedPostPublishable( state ) {
	const post = getCurrentPost( state );

	// TODO: Post being publishable should be superset of condition of post
	// being saveable. Currently this restriction is imposed at UI.
	//
	//  See: <PostPublishButton /> (`isButtonEnabled` assigned by `isSaveable`).

	return (
		isEditedPostDirty( state ) ||
		[ 'publish', 'private', 'future' ].indexOf( post.status ) === -1
	);
}

/**
 * Returns true if the post can be saved, or false otherwise. A post must
 * contain a title, an excerpt, or non-empty content to be valid for save.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post can be saved.
 */
export function isEditedPostSaveable( state ) {
	if ( isSavingPost( state ) ) {
		return false;
	}

	// TODO: Post should not be saveable if not dirty. Cannot be added here at
	// this time since posts where meta boxes are present can be saved even if
	// the post is not dirty. Currently this restriction is imposed at UI, but
	// should be moved here.
	//
	//  See: `isEditedPostPublishable` (includes `isEditedPostDirty` condition)
	//  See: <PostSavedState /> (`forceIsDirty` prop)
	//  See: <PostPublishButton /> (`forceIsDirty` prop)
	//  See: https://github.com/WordPress/gutenberg/pull/4184.

	return (
		!! getEditedPostAttribute( state, 'title' ) ||
		!! getEditedPostAttribute( state, 'excerpt' ) ||
		! isEditedPostEmpty( state ) ||
		Platform.OS === 'native'
	);
}

/**
 * Returns true if the edited post has content. A post has content if it has at
 * least one saveable block or otherwise has a non-empty content property
 * assigned.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether post has content.
 */
export const isEditedPostEmpty = createRegistrySelector(
	( select ) => ( state ) => {
		// While the condition of truthy content string is sufficient to determine
		// emptiness, testing saveable blocks length is a trivial operation. Since
		// this function can be called frequently, optimize for the fast case as a
		// condition of the mere existence of blocks. Note that the value of edited
		// content takes precedent over block content, and must fall through to the
		// default logic.
		const postId = getCurrentPostId( state );
		const postType = getCurrentPostType( state );
		const record = select( coreStore ).getEditedEntityRecord(
			'postType',
			postType,
			postId
		);
		if ( typeof record.content !== 'function' ) {
			return ! record.content;
		}

		const blocks = getEditedPostAttribute( state, 'blocks' );

		if ( blocks.length === 0 ) {
			return true;
		}

		// Pierce the abstraction of the serializer in knowing that blocks are
		// joined with newlines such that even if every individual block
		// produces an empty save result, the serialized content is non-empty.
		if ( blocks.length > 1 ) {
			return false;
		}

		// There are two conditions under which the optimization cannot be
		// assumed, and a fallthrough to getEditedPostContent must occur:
		//
		// 1. getBlocksForSerialization has special treatment in omitting a
		//    single unmodified default block.
		// 2. Comment delimiters are omitted for a freeform or unregistered
		//    block in its serialization. The freeform block specifically may
		//    produce an empty string in its saved output.
		//
		// For all other content, the single block is assumed to make a post
		// non-empty, if only by virtue of its own comment delimiters.
		const blockName = blocks[ 0 ].name;
		if (
			blockName !== getDefaultBlockName() &&
			blockName !== getFreeformContentHandlerName()
		) {
			return false;
		}

		return ! getEditedPostContent( state );
	}
);

/**
 * Returns true if the post can be autosaved, or false otherwise.
 *
 * @param {Object} state    Global application state.
 * @param {Object} autosave A raw autosave object from the REST API.
 *
 * @return {boolean} Whether the post can be autosaved.
 */
export const isEditedPostAutosaveable = createRegistrySelector(
	( select ) => ( state ) => {
		// A post must contain a title, an excerpt, or non-empty content to be valid for autosaving.
		if ( ! isEditedPostSaveable( state ) ) {
			return false;
		}

		// A post is not autosavable when there is a post autosave lock.
		if ( isPostAutosavingLocked( state ) ) {
			return false;
		}

		const postType = getCurrentPostType( state );

		// Currently template autosaving is not supported.
		if ( postType === 'wp_template' ) {
			return false;
		}

		const postId = getCurrentPostId( state );
		const hasFetchedAutosave = select( coreStore ).hasFetchedAutosaves(
			postType,
			postId
		);
		const currentUserId = select( coreStore ).getCurrentUser()?.id;

		// Disable reason - this line causes the side-effect of fetching the autosave
		// via a resolver, moving below the return would result in the autosave never
		// being fetched.
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const autosave = select( coreStore ).getAutosave(
			postType,
			postId,
			currentUserId
		);

		// If any existing autosaves have not yet been fetched, this function is
		// unable to determine if the post is autosaveable, so return false.
		if ( ! hasFetchedAutosave ) {
			return false;
		}

		// If we don't already have an autosave, the post is autosaveable.
		if ( ! autosave ) {
			return true;
		}

		// To avoid an expensive content serialization, use the content dirtiness
		// flag in place of content field comparison against the known autosave.
		// This is not strictly accurate, and relies on a tolerance toward autosave
		// request failures for unnecessary saves.
		if ( hasChangedContent( state ) ) {
			return true;
		}

		// If title, excerpt, or meta have changed, the post is autosaveable.
		return [ 'title', 'excerpt', 'meta' ].some(
			( field ) =>
				getPostRawValue( autosave[ field ] ) !==
				getEditedPostAttribute( state, field )
		);
	}
);

/**
 * Return true if the post being edited is being scheduled. Preferring the
 * unsaved status values.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post has been published.
 */
export function isEditedPostBeingScheduled( state ) {
	const date = getEditedPostAttribute( state, 'date' );
	// Offset the date by one minute (network latency).
	const checkedDate = new Date(
		Number( getDate( date ) ) - ONE_MINUTE_IN_MS
	);

	return isInTheFuture( checkedDate );
}

/**
 * Returns whether the current post should be considered to have a "floating"
 * date (i.e. that it would publish "Immediately" rather than at a set time).
 *
 * Unlike in the PHP backend, the REST API returns a full date string for posts
 * where the 0000-00-00T00:00:00 placeholder is present in the database. To
 * infer that a post is set to publish "Immediately" we check whether the date
 * and modified date are the same.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether the edited post has a floating date value.
 */
export function isEditedPostDateFloating( state ) {
	const date = getEditedPostAttribute( state, 'date' );
	const modified = getEditedPostAttribute( state, 'modified' );

	// This should be the status of the persisted post
	// It shouldn't use the "edited" status otherwise it breaks the
	// inferred post data floating status
	// See https://github.com/WordPress/gutenberg/issues/28083.
	const status = getCurrentPost( state ).status;
	if (
		status === 'draft' ||
		status === 'auto-draft' ||
		status === 'pending'
	) {
		return date === modified || date === null;
	}
	return false;
}

/**
 * Returns true if the post is currently being deleted, or false otherwise.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether post is being deleted.
 */
export function isDeletingPost( state ) {
	return !! state.deleting.pending;
}

/**
 * Returns true if the post is currently being saved, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether post is being saved.
 */
export function isSavingPost( state ) {
	return !! state.saving.pending;
}

/**
 * Returns true if non-post entities are currently being saved, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether non-post entities are being saved.
 */
export const isSavingNonPostEntityChanges = createRegistrySelector(
	( select ) => ( state ) => {
		const entitiesBeingSaved =
			select( coreStore ).__experimentalGetEntitiesBeingSaved();
		const { type, id } = getCurrentPost( state );
		return entitiesBeingSaved.some(
			( entityRecord ) =>
				entityRecord.kind !== 'postType' ||
				entityRecord.name !== type ||
				entityRecord.key !== id
		);
	}
);

/**
 * Returns true if a previous post save was attempted successfully, or false
 * otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post was saved successfully.
 */
export const didPostSaveRequestSucceed = createRegistrySelector(
	( select ) => ( state ) => {
		const postType = getCurrentPostType( state );
		const postId = getCurrentPostId( state );
		return ! select( coreStore ).getLastEntitySaveError(
			'postType',
			postType,
			postId
		);
	}
);

/**
 * Returns true if a previous post save was attempted but failed, or false
 * otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post save failed.
 */
export const didPostSaveRequestFail = createRegistrySelector(
	( select ) => ( state ) => {
		const postType = getCurrentPostType( state );
		const postId = getCurrentPostId( state );
		return !! select( coreStore ).getLastEntitySaveError(
			'postType',
			postType,
			postId
		);
	}
);

/**
 * Returns true if the post is autosaving, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post is autosaving.
 */
export function isAutosavingPost( state ) {
	return isSavingPost( state ) && Boolean( state.saving.options?.isAutosave );
}

/**
 * Returns true if the post is being previewed, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post is being previewed.
 */
export function isPreviewingPost( state ) {
	return isSavingPost( state ) && Boolean( state.saving.options?.isPreview );
}

/**
 * Returns the post preview link
 *
 * @param {Object} state Global application state.
 *
 * @return {string | undefined} Preview Link.
 */
export function getEditedPostPreviewLink( state ) {
	if ( state.saving.pending || isSavingPost( state ) ) {
		return;
	}

	let previewLink = getAutosaveAttribute( state, 'preview_link' );
	// Fix for issue: https://github.com/WordPress/gutenberg/issues/33616
	// If the post is draft, ignore the preview link from the autosave record,
	// because the preview could be a stale autosave if the post was switched from
	// published to draft.
	// See: https://github.com/WordPress/gutenberg/pull/37952.
	if ( ! previewLink || 'draft' === getCurrentPost( state ).status ) {
		previewLink = getEditedPostAttribute( state, 'link' );
		if ( previewLink ) {
			previewLink = addQueryArgs( previewLink, { preview: true } );
		}
	}
	const featuredImageId = getEditedPostAttribute( state, 'featured_media' );

	if ( previewLink && featuredImageId ) {
		return addQueryArgs( previewLink, { _thumbnail_id: featuredImageId } );
	}

	return previewLink;
}

/**
 * Returns a suggested post format for the current post, inferred only if there
 * is a single block within the post and it is of a type known to match a
 * default post format. Returns null if the format cannot be determined.
 *
 * @return {?string} Suggested post format.
 */
export const getSuggestedPostFormat = createRegistrySelector(
	( select ) => () => {
		const blocks = select( blockEditorStore ).getBlocks();

		if ( blocks.length > 2 ) {
			return null;
		}

		let name;
		// If there is only one block in the content of the post grab its name
		// so we can derive a suitable post format from it.
		if ( blocks.length === 1 ) {
			name = blocks[ 0 ].name;
			// Check for core/embed `video` and `audio` eligible suggestions.
			if ( name === 'core/embed' ) {
				const provider = blocks[ 0 ].attributes?.providerNameSlug;
				if ( [ 'youtube', 'vimeo' ].includes( provider ) ) {
					name = 'core/video';
				} else if ( [ 'spotify', 'soundcloud' ].includes( provider ) ) {
					name = 'core/audio';
				}
			}
		}

		// If there are two blocks in the content and the last one is a text blocks
		// grab the name of the first one to also suggest a post format from it.
		if ( blocks.length === 2 && blocks[ 1 ].name === 'core/paragraph' ) {
			name = blocks[ 0 ].name;
		}

		// We only convert to default post formats in core.
		switch ( name ) {
			case 'core/image':
				return 'image';
			case 'core/quote':
			case 'core/pullquote':
				return 'quote';
			case 'core/gallery':
				return 'gallery';
			case 'core/video':
				return 'video';
			case 'core/audio':
				return 'audio';
			default:
				return null;
		}
	}
);

/**
 * Returns the content of the post being edited.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Post content.
 */
export const getEditedPostContent = createRegistrySelector(
	( select ) => ( state ) => {
		const postId = getCurrentPostId( state );
		const postType = getCurrentPostType( state );
		const record = select( coreStore ).getEditedEntityRecord(
			'postType',
			postType,
			postId
		);
		if ( record ) {
			if ( typeof record.content === 'function' ) {
				return record.content( record );
			} else if ( record.blocks ) {
				return __unstableSerializeAndClean( record.blocks );
			} else if ( record.content ) {
				return record.content;
			}
		}
		return '';
	}
);

/**
 * Returns true if the post is being published, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether post is being published.
 */
export function isPublishingPost( state ) {
	return (
		isSavingPost( state ) &&
		! isCurrentPostPublished( state ) &&
		getEditedPostAttribute( state, 'status' ) === 'publish'
	);
}

/**
 * Returns whether the permalink is editable or not.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether or not the permalink is editable.
 */
export function isPermalinkEditable( state ) {
	const permalinkTemplate = getEditedPostAttribute(
		state,
		'permalink_template'
	);

	return PERMALINK_POSTNAME_REGEX.test( permalinkTemplate );
}

/**
 * Returns the permalink for the post.
 *
 * @param {Object} state Editor state.
 *
 * @return {?string} The permalink, or null if the post is not viewable.
 */
export function getPermalink( state ) {
	const permalinkParts = getPermalinkParts( state );
	if ( ! permalinkParts ) {
		return null;
	}

	const { prefix, postName, suffix } = permalinkParts;

	if ( isPermalinkEditable( state ) ) {
		return prefix + postName + suffix;
	}

	return prefix;
}

/**
 * Returns the slug for the post being edited, preferring a manually edited
 * value if one exists, then a sanitized version of the current post title, and
 * finally the post ID.
 *
 * @param {Object} state Editor state.
 *
 * @return {string} The current slug to be displayed in the editor
 */
export function getEditedPostSlug( state ) {
	return (
		getEditedPostAttribute( state, 'slug' ) ||
		cleanForSlug( getEditedPostAttribute( state, 'title' ) ) ||
		getCurrentPostId( state )
	);
}

/**
 * Returns the permalink for a post, split into its three parts: the prefix,
 * the postName, and the suffix.
 *
 * @param {Object} state Editor state.
 *
 * @return {Object} An object containing the prefix, postName, and suffix for
 *                  the permalink, or null if the post is not viewable.
 */
export function getPermalinkParts( state ) {
	const permalinkTemplate = getEditedPostAttribute(
		state,
		'permalink_template'
	);
	if ( ! permalinkTemplate ) {
		return null;
	}

	const postName =
		getEditedPostAttribute( state, 'slug' ) ||
		getEditedPostAttribute( state, 'generated_slug' );

	const [ prefix, suffix ] = permalinkTemplate.split(
		PERMALINK_POSTNAME_REGEX
	);

	return {
		prefix,
		postName,
		suffix,
	};
}

/**
 * Returns whether the post is locked.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Is locked.
 */
export function isPostLocked( state ) {
	return state.postLock.isLocked;
}

/**
 * Returns whether post saving is locked.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Is locked.
 */
export function isPostSavingLocked( state ) {
	return Object.keys( state.postSavingLock ).length > 0;
}

/**
 * Returns whether post autosaving is locked.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Is locked.
 */
export function isPostAutosavingLocked( state ) {
	return Object.keys( state.postAutosavingLock ).length > 0;
}

/**
 * Returns whether the edition of the post has been taken over.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Is post lock takeover.
 */
export function isPostLockTakeover( state ) {
	return state.postLock.isTakeover;
}

/**
 * Returns details about the post lock user.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} A user object.
 */
export function getPostLockUser( state ) {
	return state.postLock.user;
}

/**
 * Returns the active post lock.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The lock object.
 */
export function getActivePostLock( state ) {
	return state.postLock.activePostLock;
}

/**
 * Returns whether or not the user has the unfiltered_html capability.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether the user can or can't post unfiltered HTML.
 */
export function canUserUseUnfilteredHTML( state ) {
	return Boolean(
		getCurrentPost( state )._links?.hasOwnProperty(
			'wp:action-unfiltered-html'
		)
	);
}

/**
 * Returns whether the pre-publish panel should be shown
 * or skipped when the user clicks the "publish" button.
 *
 * @return {boolean} Whether the pre-publish panel should be shown or not.
 */
export const isPublishSidebarEnabled = createRegistrySelector(
	( select ) => () =>
		!! select( preferencesStore ).get( 'core', 'isPublishSidebarEnabled' )
);

/**
 * Return the current block list.
 *
 * @param {Object} state
 * @return {Array} Block list.
 */
export const getEditorBlocks = createSelector(
	( state ) => {
		return (
			getEditedPostAttribute( state, 'blocks' ) ||
			parse( getEditedPostContent( state ) )
		);
	},
	( state ) => [
		getEditedPostAttribute( state, 'blocks' ),
		getEditedPostContent( state ),
	]
);

/**
 * Returns true if the given panel was programmatically removed, or false otherwise.
 * All panels are not removed by default.
 *
 * @param {Object} state     Global application state.
 * @param {string} panelName A string that identifies the panel.
 *
 * @return {boolean} Whether or not the panel is removed.
 */
export function isEditorPanelRemoved( state, panelName ) {
	return state.removedPanels.includes( panelName );
}

/**
 * Returns true if the given panel is enabled, or false otherwise. Panels are
 * enabled by default.
 *
 * @param {Object} state     Global application state.
 * @param {string} panelName A string that identifies the panel.
 *
 * @return {boolean} Whether or not the panel is enabled.
 */
export const isEditorPanelEnabled = createRegistrySelector(
	( select ) => ( state, panelName ) => {
		// For backward compatibility, we check edit-post
		// even though now this is in "editor" package.
		const inactivePanels = select( preferencesStore ).get(
			'core',
			'inactivePanels'
		);
		return (
			! isEditorPanelRemoved( state, panelName ) &&
			! inactivePanels?.includes( panelName )
		);
	}
);

/**
 * Returns true if the given panel is open, or false otherwise. Panels are
 * closed by default.
 *
 * @param {Object} state     Global application state.
 * @param {string} panelName A string that identifies the panel.
 *
 * @return {boolean} Whether or not the panel is open.
 */
export const isEditorPanelOpened = createRegistrySelector(
	( select ) => ( state, panelName ) => {
		// For backward compatibility, we check edit-post
		// even though now this is in "editor" package.
		const openPanels = select( preferencesStore ).get(
			'core',
			'openPanels'
		);
		return !! openPanels?.includes( panelName );
	}
);

/**
 * A block selection object.
 *
 * @typedef {Object} WPBlockSelection
 *
 * @property {string} clientId     A block client ID.
 * @property {string} attributeKey A block attribute key.
 * @property {number} offset       An attribute value offset, based on the rich
 *                                 text value. See `wp.richText.create`.
 */

/**
 * Returns the current selection start.
 *
 * @param {Object} state
 * @return {WPBlockSelection} The selection start.
 *
 * @deprecated since Gutenberg 10.0.0.
 */
export function getEditorSelectionStart( state ) {
	deprecated( "select('core/editor').getEditorSelectionStart", {
		since: '5.8',
		alternative: "select('core/editor').getEditorSelection",
	} );
	return getEditedPostAttribute( state, 'selection' )?.selectionStart;
}

/**
 * Returns the current selection end.
 *
 * @param {Object} state
 * @return {WPBlockSelection} The selection end.
 *
 * @deprecated since Gutenberg 10.0.0.
 */
export function getEditorSelectionEnd( state ) {
	deprecated( "select('core/editor').getEditorSelectionStart", {
		since: '5.8',
		alternative: "select('core/editor').getEditorSelection",
	} );
	return getEditedPostAttribute( state, 'selection' )?.selectionEnd;
}

/**
 * Returns the current selection.
 *
 * @param {Object} state
 * @return {WPBlockSelection} The selection end.
 */
export function getEditorSelection( state ) {
	return getEditedPostAttribute( state, 'selection' );
}

/**
 * Is the editor ready
 *
 * @param {Object} state
 * @return {boolean} is Ready.
 */
export function __unstableIsEditorReady( state ) {
	return !! state.postId;
}

/**
 * Returns the post editor settings.
 *
 * @param {Object} state Editor state.
 *
 * @return {Object} The editor settings object.
 */
export function getEditorSettings( state ) {
	return state.editorSettings;
}

/**
 * Returns the post editor's rendering mode.
 *
 * @param {Object} state Editor state.
 *
 * @return {string} Rendering mode.
 */
export function getRenderingMode( state ) {
	return state.renderingMode;
}

/**
 * Returns the current editing canvas device type.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Device type.
 */
export const getDeviceType = createRegistrySelector(
	( select ) => ( state ) => {
		const isZoomOut = unlock( select( blockEditorStore ) ).isZoomOut();
		if ( isZoomOut ) {
			return 'Desktop';
		}
		return state.deviceType;
	}
);

/**
 * Returns true if the list view is opened.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the list view is opened.
 */
export function isListViewOpened( state ) {
	return state.listViewPanel;
}

/**
 * Returns true if the inserter is opened.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the inserter is opened.
 */
export function isInserterOpened( state ) {
	return !! state.blockInserterPanel;
}

/**
 * Returns the current editing mode.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Editing mode.
 */
export const getEditorMode = createRegistrySelector(
	( select ) => () =>
		select( preferencesStore ).get( 'core', 'editorMode' ) ?? 'visual'
);

/*
 * Backward compatibility
 */

/**
 * Returns state object prior to a specified optimist transaction ID, or `null`
 * if the transaction corresponding to the given ID cannot be found.
 *
 * @deprecated since Gutenberg 9.7.0.
 */
export function getStateBeforeOptimisticTransaction() {
	deprecated( "select('core/editor').getStateBeforeOptimisticTransaction", {
		since: '5.7',
		hint: 'No state history is kept on this store anymore',
	} );

	return null;
}
/**
 * Returns true if an optimistic transaction is pending commit, for which the
 * before state satisfies the given predicate function.
 *
 * @deprecated since Gutenberg 9.7.0.
 */
export function inSomeHistory() {
	deprecated( "select('core/editor').inSomeHistory", {
		since: '5.7',
		hint: 'No state history is kept on this store anymore',
	} );
	return false;
}

function getBlockEditorSelector( name ) {
	return createRegistrySelector( ( select ) => ( state, ...args ) => {
		deprecated( "`wp.data.select( 'core/editor' )." + name + '`', {
			since: '5.3',
			alternative: "`wp.data.select( 'core/block-editor' )." + name + '`',
			version: '6.2',
		} );

		return select( blockEditorStore )[ name ]( ...args );
	} );
}

/**
 * @see getBlockName in core/block-editor store.
 */
export const getBlockName = getBlockEditorSelector( 'getBlockName' );

/**
 * @see isBlockValid in core/block-editor store.
 */
export const isBlockValid = getBlockEditorSelector( 'isBlockValid' );

/**
 * @see getBlockAttributes in core/block-editor store.
 */
export const getBlockAttributes =
	getBlockEditorSelector( 'getBlockAttributes' );

/**
 * @see getBlock in core/block-editor store.
 */
export const getBlock = getBlockEditorSelector( 'getBlock' );

/**
 * @see getBlocks in core/block-editor store.
 */
export const getBlocks = getBlockEditorSelector( 'getBlocks' );

/**
 * @see getClientIdsOfDescendants in core/block-editor store.
 */
export const getClientIdsOfDescendants = getBlockEditorSelector(
	'getClientIdsOfDescendants'
);

/**
 * @see getClientIdsWithDescendants in core/block-editor store.
 */
export const getClientIdsWithDescendants = getBlockEditorSelector(
	'getClientIdsWithDescendants'
);

/**
 * @see getGlobalBlockCount in core/block-editor store.
 */
export const getGlobalBlockCount = getBlockEditorSelector(
	'getGlobalBlockCount'
);

/**
 * @see getBlocksByClientId in core/block-editor store.
 */
export const getBlocksByClientId = getBlockEditorSelector(
	'getBlocksByClientId'
);

/**
 * @see getBlockCount in core/block-editor store.
 */
export const getBlockCount = getBlockEditorSelector( 'getBlockCount' );

/**
 * @see getBlockSelectionStart in core/block-editor store.
 */
export const getBlockSelectionStart = getBlockEditorSelector(
	'getBlockSelectionStart'
);

/**
 * @see getBlockSelectionEnd in core/block-editor store.
 */
export const getBlockSelectionEnd = getBlockEditorSelector(
	'getBlockSelectionEnd'
);

/**
 * @see getSelectedBlockCount in core/block-editor store.
 */
export const getSelectedBlockCount = getBlockEditorSelector(
	'getSelectedBlockCount'
);

/**
 * @see hasSelectedBlock in core/block-editor store.
 */
export const hasSelectedBlock = getBlockEditorSelector( 'hasSelectedBlock' );

/**
 * @see getSelectedBlockClientId in core/block-editor store.
 */
export const getSelectedBlockClientId = getBlockEditorSelector(
	'getSelectedBlockClientId'
);

/**
 * @see getSelectedBlock in core/block-editor store.
 */
export const getSelectedBlock = getBlockEditorSelector( 'getSelectedBlock' );

/**
 * @see getBlockRootClientId in core/block-editor store.
 */
export const getBlockRootClientId = getBlockEditorSelector(
	'getBlockRootClientId'
);

/**
 * @see getBlockHierarchyRootClientId in core/block-editor store.
 */
export const getBlockHierarchyRootClientId = getBlockEditorSelector(
	'getBlockHierarchyRootClientId'
);

/**
 * @see getAdjacentBlockClientId in core/block-editor store.
 */
export const getAdjacentBlockClientId = getBlockEditorSelector(
	'getAdjacentBlockClientId'
);

/**
 * @see getPreviousBlockClientId in core/block-editor store.
 */
export const getPreviousBlockClientId = getBlockEditorSelector(
	'getPreviousBlockClientId'
);

/**
 * @see getNextBlockClientId in core/block-editor store.
 */
export const getNextBlockClientId = getBlockEditorSelector(
	'getNextBlockClientId'
);

/**
 * @see getSelectedBlocksInitialCaretPosition in core/block-editor store.
 */
export const getSelectedBlocksInitialCaretPosition = getBlockEditorSelector(
	'getSelectedBlocksInitialCaretPosition'
);

/**
 * @see getMultiSelectedBlockClientIds in core/block-editor store.
 */
export const getMultiSelectedBlockClientIds = getBlockEditorSelector(
	'getMultiSelectedBlockClientIds'
);

/**
 * @see getMultiSelectedBlocks in core/block-editor store.
 */
export const getMultiSelectedBlocks = getBlockEditorSelector(
	'getMultiSelectedBlocks'
);

/**
 * @see getFirstMultiSelectedBlockClientId in core/block-editor store.
 */
export const getFirstMultiSelectedBlockClientId = getBlockEditorSelector(
	'getFirstMultiSelectedBlockClientId'
);

/**
 * @see getLastMultiSelectedBlockClientId in core/block-editor store.
 */
export const getLastMultiSelectedBlockClientId = getBlockEditorSelector(
	'getLastMultiSelectedBlockClientId'
);

/**
 * @see isFirstMultiSelectedBlock in core/block-editor store.
 */
export const isFirstMultiSelectedBlock = getBlockEditorSelector(
	'isFirstMultiSelectedBlock'
);

/**
 * @see isBlockMultiSelected in core/block-editor store.
 */
export const isBlockMultiSelected = getBlockEditorSelector(
	'isBlockMultiSelected'
);

/**
 * @see isAncestorMultiSelected in core/block-editor store.
 */
export const isAncestorMultiSelected = getBlockEditorSelector(
	'isAncestorMultiSelected'
);

/**
 * @see getMultiSelectedBlocksStartClientId in core/block-editor store.
 */
export const getMultiSelectedBlocksStartClientId = getBlockEditorSelector(
	'getMultiSelectedBlocksStartClientId'
);

/**
 * @see getMultiSelectedBlocksEndClientId in core/block-editor store.
 */
export const getMultiSelectedBlocksEndClientId = getBlockEditorSelector(
	'getMultiSelectedBlocksEndClientId'
);

/**
 * @see getBlockOrder in core/block-editor store.
 */
export const getBlockOrder = getBlockEditorSelector( 'getBlockOrder' );

/**
 * @see getBlockIndex in core/block-editor store.
 */
export const getBlockIndex = getBlockEditorSelector( 'getBlockIndex' );

/**
 * @see isBlockSelected in core/block-editor store.
 */
export const isBlockSelected = getBlockEditorSelector( 'isBlockSelected' );

/**
 * @see hasSelectedInnerBlock in core/block-editor store.
 */
export const hasSelectedInnerBlock = getBlockEditorSelector(
	'hasSelectedInnerBlock'
);

/**
 * @see isBlockWithinSelection in core/block-editor store.
 */
export const isBlockWithinSelection = getBlockEditorSelector(
	'isBlockWithinSelection'
);

/**
 * @see hasMultiSelection in core/block-editor store.
 */
export const hasMultiSelection = getBlockEditorSelector( 'hasMultiSelection' );

/**
 * @see isMultiSelecting in core/block-editor store.
 */
export const isMultiSelecting = getBlockEditorSelector( 'isMultiSelecting' );

/**
 * @see isSelectionEnabled in core/block-editor store.
 */
export const isSelectionEnabled =
	getBlockEditorSelector( 'isSelectionEnabled' );

/**
 * @see getBlockMode in core/block-editor store.
 */
export const getBlockMode = getBlockEditorSelector( 'getBlockMode' );

/**
 * @see isTyping in core/block-editor store.
 */
export const isTyping = getBlockEditorSelector( 'isTyping' );

/**
 * @see isCaretWithinFormattedText in core/block-editor store.
 */
export const isCaretWithinFormattedText = getBlockEditorSelector(
	'isCaretWithinFormattedText'
);

/**
 * @see getBlockInsertionPoint in core/block-editor store.
 */
export const getBlockInsertionPoint = getBlockEditorSelector(
	'getBlockInsertionPoint'
);

/**
 * @see isBlockInsertionPointVisible in core/block-editor store.
 */
export const isBlockInsertionPointVisible = getBlockEditorSelector(
	'isBlockInsertionPointVisible'
);

/**
 * @see isValidTemplate in core/block-editor store.
 */
export const isValidTemplate = getBlockEditorSelector( 'isValidTemplate' );

/**
 * @see getTemplate in core/block-editor store.
 */
export const getTemplate = getBlockEditorSelector( 'getTemplate' );

/**
 * @see getTemplateLock in core/block-editor store.
 */
export const getTemplateLock = getBlockEditorSelector( 'getTemplateLock' );

/**
 * @see canInsertBlockType in core/block-editor store.
 */
export const canInsertBlockType =
	getBlockEditorSelector( 'canInsertBlockType' );

/**
 * @see getInserterItems in core/block-editor store.
 */
export const getInserterItems = getBlockEditorSelector( 'getInserterItems' );

/**
 * @see hasInserterItems in core/block-editor store.
 */
export const hasInserterItems = getBlockEditorSelector( 'hasInserterItems' );

/**
 * @see getBlockListSettings in core/block-editor store.
 */
export const getBlockListSettings = getBlockEditorSelector(
	'getBlockListSettings'
);

/**
 * Returns the default template types.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The template types.
 */
export function __experimentalGetDefaultTemplateTypes( state ) {
	return getEditorSettings( state )?.defaultTemplateTypes;
}

/**
 * Returns the default template part areas.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} The template part areas.
 */
export const __experimentalGetDefaultTemplatePartAreas = createSelector(
	( state ) => {
		const areas =
			getEditorSettings( state )?.defaultTemplatePartAreas ?? [];
		return areas.map( ( item ) => {
			return { ...item, icon: getTemplatePartIcon( item.icon ) };
		} );
	},
	( state ) => [ getEditorSettings( state )?.defaultTemplatePartAreas ]
);

/**
 * Returns a default template type searched by slug.
 *
 * @param {Object} state Global application state.
 * @param {string} slug  The template type slug.
 *
 * @return {Object} The template type.
 */
export const __experimentalGetDefaultTemplateType = createSelector(
	( state, slug ) => {
		const templateTypes = __experimentalGetDefaultTemplateTypes( state );
		if ( ! templateTypes ) {
			return EMPTY_OBJECT;
		}

		return (
			Object.values( templateTypes ).find(
				( type ) => type.slug === slug
			) ?? EMPTY_OBJECT
		);
	},
	( state ) => [ __experimentalGetDefaultTemplateTypes( state ) ]
);

/**
 * Given a template entity, return information about it which is ready to be
 * rendered, such as the title, description, and icon.
 *
 * @param {Object} state    Global application state.
 * @param {Object} template The template for which we need information.
 * @return {Object} Information about the template, including title, description, and icon.
 */
export const __experimentalGetTemplateInfo = createSelector(
	( state, template ) => {
		if ( ! template ) {
			return EMPTY_OBJECT;
		}

		const { description, slug, title, area } = template;
		const { title: defaultTitle, description: defaultDescription } =
			__experimentalGetDefaultTemplateType( state, slug );

		const templateTitle =
			typeof title === 'string' ? title : title?.rendered;
		const templateDescription =
			typeof description === 'string' ? description : description?.raw;
		const templateIcon =
			__experimentalGetDefaultTemplatePartAreas( state ).find(
				( item ) => area === item.area
			)?.icon || layout;

		return {
			title:
				templateTitle && templateTitle !== slug
					? templateTitle
					: defaultTitle || slug,
			description: templateDescription || defaultDescription,
			icon: templateIcon,
		};
	},
	( state ) => [
		__experimentalGetDefaultTemplateTypes( state ),
		__experimentalGetDefaultTemplatePartAreas( state ),
	]
);

/**
 * Returns a post type label depending on the current post.
 *
 * @param {Object} state Global application state.
 *
 * @return {string|undefined} The post type label if available, otherwise undefined.
 */
export const getPostTypeLabel = createRegistrySelector(
	( select ) => ( state ) => {
		const currentPostType = getCurrentPostType( state );
		const postType = select( coreStore ).getPostType( currentPostType );
		// Disable reason: Post type labels object is shaped like this.
		// eslint-disable-next-line camelcase
		return postType?.labels?.singular_name;
	}
);

/**
 * Returns true if the publish sidebar is opened.
 *
 * @param {Object} state Global application state
 *
 * @return {boolean} Whether the publish sidebar is open.
 */
export function isPublishSidebarOpened( state ) {
	return state.publishSidebarActive;
}
