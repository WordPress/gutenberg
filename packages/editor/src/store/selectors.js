/**
 * External dependencies
 */
import {
	find,
	get,
	has,
	map,
	pick,
	mapValues,
	includes,
} from 'lodash';
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import {
	serialize,
	getFreeformContentHandlerName,
	getDefaultBlockName,
	isUnmodifiedDefaultBlock,
} from '@wordpress/blocks';
import { isInTheFuture, getDate } from '@wordpress/date';
import { removep } from '@wordpress/autop';
import { addQueryArgs } from '@wordpress/url';
import { createRegistrySelector } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS } from './defaults';
import {
	EDIT_MERGE_PROPERTIES,
	POST_UPDATE_TRANSACTION_ID,
	PERMALINK_POSTNAME_REGEX,
	ONE_MINUTE_IN_MS,
	AUTOSAVE_PROPERTIES,
} from './constants';
import { getPostRawValue } from './reducer';

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
export function hasEditorUndo( state ) {
	return state.editor.past.length > 0;
}

/**
 * Returns true if any future editor history snapshots exist, or false
 * otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether redo history exists.
 */
export function hasEditorRedo( state ) {
	return state.editor.future.length > 0;
}

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
	return (
		state.editor.present.blocks.isDirty ||

		// `edits` is intended to contain only values which are different from
		// the saved post, so the mere presence of a property is an indicator
		// that the value is different than what is known to be saved. While
		// content in Visual mode is represented by the blocks state, in Text
		// mode it is tracked by `edits.content`.
		'content' in state.editor.present.edits
	);
}

/**
 * Returns true if there are unsaved values for the current edit session, or
 * false if the editing state matches the saved or new post.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether unsaved values exist.
 */
export function isEditedPostDirty( state ) {
	if ( hasChangedContent( state ) ) {
		return true;
	}

	// Edits should contain only fields which differ from the saved post (reset
	// at initial load and save complete). Thus, a non-empty edits state can be
	// inferred to contain unsaved values.
	if ( Object.keys( state.editor.present.edits ).length > 0 ) {
		return true;
	}

	// Edits and change detection are reset at the start of a save, but a post
	// is still considered dirty until the point at which the save completes.
	// Because the save is performed optimistically, the prior states are held
	// until committed. These can be referenced to determine whether there's a
	// chance that state may be reverted into one considered dirty.
	return inSomeHistory( state, isEditedPostDirty );
}

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
export function getCurrentPost( state ) {
	return state.currentPost;
}

/**
 * Returns the post type of the post currently being edited.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Post type.
 */
export function getCurrentPostType( state ) {
	return state.currentPost.type;
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
	return getCurrentPost( state ).id || null;
}

/**
 * Returns the number of revisions of the post currently being edited.
 *
 * @param {Object} state Global application state.
 *
 * @return {number} Number of revisions.
 */
export function getCurrentPostRevisionsCount( state ) {
	return get( getCurrentPost( state ), [ '_links', 'version-history', 0, 'count' ], 0 );
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
	return get( getCurrentPost( state ), [ '_links', 'predecessor-version', 0, 'id' ], null );
}

/**
 * Returns any post values which have been changed in the editor but not yet
 * been saved.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Object of key value pairs comprising unsaved edits.
 */
export const getPostEdits = createSelector(
	( state ) => {
		return {
			...state.initialEdits,
			...state.editor.present.edits,
		};
	},
	( state ) => [
		state.editor.present.edits,
		state.initialEdits,
	]
);

/**
 * Returns a new reference when edited values have changed. This is useful in
 * inferring where an edit has been made between states by comparison of the
 * return values using strict equality.
 *
 * @example
 *
 * ```
 * const hasEditOccurred = (
 *    getReferenceByDistinctEdits( beforeState ) !==
 *    getReferenceByDistinctEdits( afterState )
 * );
 * ```
 *
 * @param {Object} state Editor state.
 *
 * @return {*} A value whose reference will change only when an edit occurs.
 */
export const getReferenceByDistinctEdits = createSelector(
	() => [],
	( state ) => [ state.editor ],
);

/**
 * Returns an attribute value of the saved post.
 *
 * @param {Object} state         Global application state.
 * @param {string} attributeName Post attribute name.
 *
 * @return {*} Post attribute value.
 */
export function getCurrentPostAttribute( state, attributeName ) {
	const post = getCurrentPost( state );
	if ( post.hasOwnProperty( attributeName ) ) {
		return post[ attributeName ];
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
		get( state.editor.present.edits, [ attributeName ], EMPTY_OBJECT ),
		get( state.currentPost, [ attributeName ], EMPTY_OBJECT ),
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
 * @return {*} Post attribute value.
 */
export function getEditedPostAttribute( state, attributeName ) {
	// Special cases
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
export const getAutosaveAttribute = createRegistrySelector( ( select ) => ( state, attributeName ) => {
	deprecated( '`wp.data.select( \'core/editor\' ).getAutosaveAttribute( attributeName )`', {
		alternative: '`wp.data.select( \'core\' ).getAutosave( postType, postId, userId )`',
		plugin: 'Gutenberg',
	} );

	if ( ! includes( AUTOSAVE_PROPERTIES, attributeName ) ) {
		return;
	}

	const postType = getCurrentPostType( state );
	const postId = getCurrentPostId( state );
	const currentUserId = get( select( 'core' ).getCurrentUser(), [ 'id' ] );
	const autosave = select( 'core' ).getAutosave( postType, postId, currentUserId );

	if ( autosave ) {
		return getPostRawValue( autosave[ attributeName ] );
	}
} );

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
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post has been published.
 */
export function isCurrentPostPublished( state ) {
	const post = getCurrentPost( state );

	return [ 'publish', 'private' ].indexOf( post.status ) !== -1 ||
		( post.status === 'future' && ! isInTheFuture( new Date( Number( getDate( post.date ) ) - ONE_MINUTE_IN_MS ) ) );
}

/**
 * Returns true if post is already scheduled.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether current post is scheduled to be posted.
 */
export function isCurrentPostScheduled( state ) {
	return getCurrentPost( state ).status === 'future' && ! isCurrentPostPublished( state );
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
	//  See: <PostPublishButton /> (`isButtonEnabled` assigned by `isSaveable`)

	return isEditedPostDirty( state ) || [ 'publish', 'private', 'future' ].indexOf( post.status ) === -1;
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
	//  See: https://github.com/WordPress/gutenberg/pull/4184

	return (
		!! getEditedPostAttribute( state, 'title' ) ||
		!! getEditedPostAttribute( state, 'excerpt' ) ||
		! isEditedPostEmpty( state )
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
export function isEditedPostEmpty( state ) {
	// While the condition of truthy content string is sufficient to determine
	// emptiness, testing saveable blocks length is a trivial operation. Since
	// this function can be called frequently, optimize for the fast case as a
	// condition of the mere existence of blocks. Note that the value of edited
	// content takes precedent over block content, and must fall through to the
	// default logic.
	const blocks = state.editor.present.blocks.value;

	if ( blocks.length && ! ( 'content' in getPostEdits( state ) ) ) {
		// Pierce the abstraction of the serializer in knowing that blocks are
		// joined with with newlines such that even if every individual block
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
	}

	return ! getEditedPostContent( state );
}

/**
 * Returns true if the post can be autosaved, or false otherwise.
 *
 * @param {Object} state    Global application state.
 * @param {Object} autosave A raw autosave object from the REST API.
 *
 * @return {boolean} Whether the post can be autosaved.
 */
export const isEditedPostAutosaveable = createRegistrySelector( ( select ) => function( state ) {
	// A post must contain a title, an excerpt, or non-empty content to be valid for autosaving.
	if ( ! isEditedPostSaveable( state ) ) {
		return false;
	}

	const postType = getCurrentPostType( state );
	const postId = getCurrentPostId( state );
	const hasFetchedAutosave = select( 'core' ).hasFetchedAutosaves( postType, postId );
	const currentUserId = get( select( 'core' ).getCurrentUser(), [ 'id' ] );

	// Disable reason - this line causes the side-effect of fetching the autosave
	// via a resolver, moving below the return would result in the autosave never
	// being fetched.
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const autosave = select( 'core' ).getAutosave( postType, postId, currentUserId );

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

	// If the title or excerpt has changed, the post is autosaveable.
	return [ 'title', 'excerpt' ].some( ( field ) => (
		getPostRawValue( autosave[ field ] ) !== getEditedPostAttribute( state, field )
	) );
} );

/**
 * Returns the current autosave, or null if one is not set (i.e. if the post
 * has yet to be autosaved, or has been saved or published since the last
 * autosave).
 *
 * @deprecated since 5.6. Callers should use the `getAutosave( postType, postId, userId )`
 * 			   selector from the '@wordpress/core-data' package.
 *
 * @param {Object} state Editor state.
 *
 * @return {?Object} Current autosave, if exists.
 */
export const getAutosave = createRegistrySelector( ( select ) => ( state ) => {
	deprecated( '`wp.data.select( \'core/editor\' ).getAutosave()`', {
		alternative: '`wp.data.select( \'core\' ).getAutosave( postType, postId, userId )`',
		plugin: 'Gutenberg',
	} );

	const postType = getCurrentPostType( state );
	const postId = getCurrentPostId( state );
	const currentUserId = get( select( 'core' ).getCurrentUser(), [ 'id' ] );
	const autosave = select( 'core' ).getAutosave( postType, postId, currentUserId );
	return mapValues( pick( autosave, AUTOSAVE_PROPERTIES ), getPostRawValue );
} );

/**
 * Returns the true if there is an existing autosave, otherwise false.
 *
 * @deprecated since 5.6. Callers should use the `getAutosave( postType, postId, userId )` selector
 *             from the '@wordpress/core-data' package and check for a truthy value.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether there is an existing autosave.
 */
export const hasAutosave = createRegistrySelector( ( select ) => ( state ) => {
	deprecated( '`wp.data.select( \'core/editor\' ).hasAutosave()`', {
		alternative: '`!! wp.data.select( \'core\' ).getAutosave( postType, postId, userId )`',
		plugin: 'Gutenberg',
	} );

	const postType = getCurrentPostType( state );
	const postId = getCurrentPostId( state );
	const currentUserId = get( select( 'core' ).getCurrentUser(), [ 'id' ] );
	return !! select( 'core' ).getAutosave( postType, postId, currentUserId );
} );

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
	// Offset the date by one minute (network latency)
	const checkedDate = new Date( Number( getDate( date ) ) - ONE_MINUTE_IN_MS );

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
	const status = getEditedPostAttribute( state, 'status' );
	if ( status === 'draft' || status === 'auto-draft' || status === 'pending' ) {
		return date === modified;
	}
	return false;
}

/**
 * Returns true if the post is currently being saved, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether post is being saved.
 */
export function isSavingPost( state ) {
	return state.saving.requesting;
}

/**
 * Returns true if a previous post save was attempted successfully, or false
 * otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post was saved successfully.
 */
export function didPostSaveRequestSucceed( state ) {
	return state.saving.successful;
}

/**
 * Returns true if a previous post save was attempted but failed, or false
 * otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post save failed.
 */
export function didPostSaveRequestFail( state ) {
	return !! state.saving.error;
}

/**
 * Returns true if the post is autosaving, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post is autosaving.
 */
export function isAutosavingPost( state ) {
	return isSavingPost( state ) && !! state.saving.options.isAutosave;
}

/**
 * Returns true if the post is being previewed, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the post is being previewed.
 */
export function isPreviewingPost( state ) {
	return isSavingPost( state ) && !! state.saving.options.isPreview;
}

/**
 * Returns the post preview link
 *
 * @param {Object} state Global application state.
 *
 * @return {string?} Preview Link.
 */
export function getEditedPostPreviewLink( state ) {
	const featuredImageId = getEditedPostAttribute( state, 'featured_media' );
	const previewLink = state.previewLink;
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
 * @param {Object} state Global application state.
 *
 * @return {?string} Suggested post format.
 */
export function getSuggestedPostFormat( state ) {
	const blocks = state.editor.present.blocks.value;

	let name;
	// If there is only one block in the content of the post grab its name
	// so we can derive a suitable post format from it.
	if ( blocks.length === 1 ) {
		name = blocks[ 0 ].name;
	}

	// If there are two blocks in the content and the last one is a text blocks
	// grab the name of the first one to also suggest a post format from it.
	if ( blocks.length === 2 ) {
		if ( blocks[ 1 ].name === 'core/paragraph' ) {
			name = blocks[ 0 ].name;
		}
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
		case 'core-embed/youtube':
		case 'core-embed/vimeo':
			return 'video';
		case 'core/audio':
		case 'core-embed/spotify':
		case 'core-embed/soundcloud':
			return 'audio';
	}

	return null;
}

/**
 * Returns a set of blocks which are to be used in consideration of the post's
 * generated save content.
 *
 * @param {Object} state Editor state.
 *
 * @return {WPBlock[]} Filtered set of blocks for save.
 */
export function getBlocksForSerialization( state ) {
	const blocks = state.editor.present.blocks.value;

	// WARNING: Any changes to the logic of this function should be verified
	// against the implementation of isEditedPostEmpty, which bypasses this
	// function for performance' sake, in an assumption of this current logic
	// being irrelevant to the optimized condition of emptiness.

	// A single unmodified default block is assumed to be equivalent to an
	// empty post.
	const isSingleUnmodifiedDefaultBlock = (
		blocks.length === 1 &&
		isUnmodifiedDefaultBlock( blocks[ 0 ] )
	);

	if ( isSingleUnmodifiedDefaultBlock ) {
		return [];
	}

	return blocks;
}

/**
 * Returns the content of the post being edited, preferring raw string edit
 * before falling back to serialization of block state.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Post content.
 */
export const getEditedPostContent = createSelector(
	( state ) => {
		const edits = getPostEdits( state );
		if ( 'content' in edits ) {
			return edits.content;
		}

		const blocks = getBlocksForSerialization( state );
		const content = serialize( blocks );

		// For compatibility purposes, treat a post consisting of a single
		// freeform block as legacy content and downgrade to a pre-block-editor
		// removep'd content format.
		const isSingleFreeformBlock = (
			blocks.length === 1 &&
			blocks[ 0 ].name === getFreeformContentHandlerName()
		);

		if ( isSingleFreeformBlock ) {
			return removep( content );
		}

		return content;
	},
	( state ) => [
		state.editor.present.blocks.value,
		state.editor.present.edits.content,
		state.initialEdits.content,
	],
);

/**
 * Returns the reusable block with the given ID.
 *
 * @param {Object}        state Global application state.
 * @param {number|string} ref   The reusable block's ID.
 *
 * @return {Object} The reusable block, or null if none exists.
 */
export const __experimentalGetReusableBlock = createSelector(
	( state, ref ) => {
		const block = state.reusableBlocks.data[ ref ];
		if ( ! block ) {
			return null;
		}

		const isTemporary = isNaN( parseInt( ref ) );

		return {
			...block,
			id: isTemporary ? ref : +ref,
			isTemporary,
		};
	},
	( state, ref ) => [
		state.reusableBlocks.data[ ref ],
	],
);

/**
 * Returns whether or not the reusable block with the given ID is being saved.
 *
 * @param {Object} state Global application state.
 * @param {string} ref   The reusable block's ID.
 *
 * @return {boolean} Whether or not the reusable block is being saved.
 */
export function __experimentalIsSavingReusableBlock( state, ref ) {
	return state.reusableBlocks.isSaving[ ref ] || false;
}

/**
 * Returns true if the reusable block with the given ID is being fetched, or
 * false otherwise.
 *
 * @param {Object} state Global application state.
 * @param {string} ref   The reusable block's ID.
 *
 * @return {boolean} Whether the reusable block is being fetched.
 */
export function __experimentalIsFetchingReusableBlock( state, ref ) {
	return !! state.reusableBlocks.isFetching[ ref ];
}

/**
 * Returns an array of all reusable blocks.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} An array of all reusable blocks.
 */
export const __experimentalGetReusableBlocks = createSelector(
	( state ) => {
		return map(
			state.reusableBlocks.data,
			( value, ref ) => __experimentalGetReusableBlock( state, ref )
		);
	},
	( state ) => [
		state.reusableBlocks.data,
	]
);

/**
 * Returns state object prior to a specified optimist transaction ID, or `null`
 * if the transaction corresponding to the given ID cannot be found.
 *
 * @param {Object} state         Current global application state.
 * @param {Object} transactionId Optimist transaction ID.
 *
 * @return {Object} Global application state prior to transaction.
 */
export function getStateBeforeOptimisticTransaction( state, transactionId ) {
	const transaction = find( state.optimist, ( entry ) => (
		entry.beforeState &&
		get( entry.action, [ 'optimist', 'id' ] ) === transactionId
	) );

	return transaction ? transaction.beforeState : null;
}

/**
 * Returns true if the post is being published, or false otherwise.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether post is being published.
 */
export function isPublishingPost( state ) {
	if ( ! isSavingPost( state ) ) {
		return false;
	}

	// Saving is optimistic, so assume that current post would be marked as
	// published if publishing
	if ( ! isCurrentPostPublished( state ) ) {
		return false;
	}

	// Use post update transaction ID to retrieve the state prior to the
	// optimistic transaction
	const stateBeforeRequest = getStateBeforeOptimisticTransaction(
		state,
		POST_UPDATE_TRANSACTION_ID
	);

	// Consider as publishing when current post prior to request was not
	// considered published
	return !! stateBeforeRequest && ! isCurrentPostPublished( stateBeforeRequest );
}

/**
 * Returns whether the permalink is editable or not.
 *
 * @param {Object} state Editor state.
 *
 * @return {boolean} Whether or not the permalink is editable.
 */
export function isPermalinkEditable( state ) {
	const permalinkTemplate = getEditedPostAttribute( state, 'permalink_template' );

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
 * Returns the permalink for a post, split into it's three parts: the prefix,
 * the postName, and the suffix.
 *
 * @param {Object} state Editor state.
 *
 * @return {Object} An object containing the prefix, postName, and suffix for
 *                  the permalink, or null if the post is not viewable.
 */
export function getPermalinkParts( state ) {
	const permalinkTemplate = getEditedPostAttribute( state, 'permalink_template' );
	if ( ! permalinkTemplate ) {
		return null;
	}

	const postName = getEditedPostAttribute( state, 'slug' ) || getEditedPostAttribute( state, 'generated_slug' );

	const [ prefix, suffix ] = permalinkTemplate.split( PERMALINK_POSTNAME_REGEX );

	return {
		prefix,
		postName,
		suffix,
	};
}

/**
 * Returns true if an optimistic transaction is pending commit, for which the
 * before state satisfies the given predicate function.
 *
 * @param {Object}   state     Editor state.
 * @param {Function} predicate Function given state, returning true if match.
 *
 * @return {boolean} Whether predicate matches for some history.
 */
export function inSomeHistory( state, predicate ) {
	const { optimist } = state;

	// In recursion, optimist state won't exist. Assume exhausted options.
	if ( ! optimist ) {
		return false;
	}

	return optimist.some( ( { beforeState } ) => (
		beforeState && predicate( beforeState )
	) );
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
	return has( getCurrentPost( state ), [ '_links', 'wp:action-unfiltered-html' ] );
}

/**
 * Returns whether the pre-publish panel should be shown
 * or skipped when the user clicks the "publish" button.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the pre-publish panel should be shown or not.
 */
export function isPublishSidebarEnabled( state ) {
	if ( state.preferences.hasOwnProperty( 'isPublishSidebarEnabled' ) ) {
		return state.preferences.isPublishSidebarEnabled;
	}
	return PREFERENCES_DEFAULTS.isPublishSidebarEnabled;
}

/**
 * Return the current block list.
 *
 * @param {Object} state
 * @return {Array} Block list.
 */
export function getEditorBlocks( state ) {
	return state.editor.present.blocks.value;
}

/**
 * Is the editor ready
 *
 * @param {Object} state
 * @return {boolean} is Ready.
 */
export function __unstableIsEditorReady( state ) {
	return state.isReady;
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

/*
 * Backward compatibility
 */

function getBlockEditorSelector( name ) {
	return createRegistrySelector( ( select ) => ( state, ...args ) => {
		deprecated( '`wp.data.select( \'core/editor\' ).' + name + '`', {
			alternative: '`wp.data.select( \'core/block-editor\' ).' + name + '`',
		} );

		return select( 'core/block-editor' )[ name ]( ...args );
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
export const getBlockAttributes = getBlockEditorSelector( 'getBlockAttributes' );

/**
 * @see getBlock in core/block-editor store.
 */
export const getBlock = getBlockEditorSelector( 'getBlock' );

/**
 * @see getBlocks in core/block-editor store.
 */
export const getBlocks = getBlockEditorSelector( 'getBlocks' );

/**
 * @see __unstableGetBlockWithoutInnerBlocks in core/block-editor store.
 */
export const __unstableGetBlockWithoutInnerBlocks = getBlockEditorSelector( '__unstableGetBlockWithoutInnerBlocks' );

/**
 * @see getClientIdsOfDescendants in core/block-editor store.
 */
export const getClientIdsOfDescendants = getBlockEditorSelector( 'getClientIdsOfDescendants' );

/**
 * @see getClientIdsWithDescendants in core/block-editor store.
 */
export const getClientIdsWithDescendants = getBlockEditorSelector( 'getClientIdsWithDescendants' );

/**
 * @see getGlobalBlockCount in core/block-editor store.
 */
export const getGlobalBlockCount = getBlockEditorSelector( 'getGlobalBlockCount' );

/**
 * @see getBlocksByClientId in core/block-editor store.
 */
export const getBlocksByClientId = getBlockEditorSelector( 'getBlocksByClientId' );

/**
 * @see getBlockCount in core/block-editor store.
 */
export const getBlockCount = getBlockEditorSelector( 'getBlockCount' );

/**
 * @see getBlockSelectionStart in core/block-editor store.
 */
export const getBlockSelectionStart = getBlockEditorSelector( 'getBlockSelectionStart' );

/**
 * @see getBlockSelectionEnd in core/block-editor store.
 */
export const getBlockSelectionEnd = getBlockEditorSelector( 'getBlockSelectionEnd' );

/**
 * @see getSelectedBlockCount in core/block-editor store.
 */
export const getSelectedBlockCount = getBlockEditorSelector( 'getSelectedBlockCount' );

/**
 * @see hasSelectedBlock in core/block-editor store.
 */
export const hasSelectedBlock = getBlockEditorSelector( 'hasSelectedBlock' );

/**
 * @see getSelectedBlockClientId in core/block-editor store.
 */
export const getSelectedBlockClientId = getBlockEditorSelector( 'getSelectedBlockClientId' );

/**
 * @see getSelectedBlock in core/block-editor store.
 */
export const getSelectedBlock = getBlockEditorSelector( 'getSelectedBlock' );

/**
 * @see getBlockRootClientId in core/block-editor store.
 */
export const getBlockRootClientId = getBlockEditorSelector( 'getBlockRootClientId' );

/**
 * @see getBlockHierarchyRootClientId in core/block-editor store.
 */
export const getBlockHierarchyRootClientId = getBlockEditorSelector( 'getBlockHierarchyRootClientId' );

/**
 * @see getAdjacentBlockClientId in core/block-editor store.
 */
export const getAdjacentBlockClientId = getBlockEditorSelector( 'getAdjacentBlockClientId' );

/**
 * @see getPreviousBlockClientId in core/block-editor store.
 */
export const getPreviousBlockClientId = getBlockEditorSelector( 'getPreviousBlockClientId' );

/**
 * @see getNextBlockClientId in core/block-editor store.
 */
export const getNextBlockClientId = getBlockEditorSelector( 'getNextBlockClientId' );

/**
 * @see getSelectedBlocksInitialCaretPosition in core/block-editor store.
 */
export const getSelectedBlocksInitialCaretPosition = getBlockEditorSelector( 'getSelectedBlocksInitialCaretPosition' );

/**
 * @see getMultiSelectedBlockClientIds in core/block-editor store.
 */
export const getMultiSelectedBlockClientIds = getBlockEditorSelector( 'getMultiSelectedBlockClientIds' );

/**
 * @see getMultiSelectedBlocks in core/block-editor store.
 */
export const getMultiSelectedBlocks = getBlockEditorSelector( 'getMultiSelectedBlocks' );

/**
 * @see getFirstMultiSelectedBlockClientId in core/block-editor store.
 */
export const getFirstMultiSelectedBlockClientId = getBlockEditorSelector( 'getFirstMultiSelectedBlockClientId' );

/**
 * @see getLastMultiSelectedBlockClientId in core/block-editor store.
 */
export const getLastMultiSelectedBlockClientId = getBlockEditorSelector( 'getLastMultiSelectedBlockClientId' );

/**
 * @see isFirstMultiSelectedBlock in core/block-editor store.
 */
export const isFirstMultiSelectedBlock = getBlockEditorSelector( 'isFirstMultiSelectedBlock' );

/**
 * @see isBlockMultiSelected in core/block-editor store.
 */
export const isBlockMultiSelected = getBlockEditorSelector( 'isBlockMultiSelected' );

/**
 * @see isAncestorMultiSelected in core/block-editor store.
 */
export const isAncestorMultiSelected = getBlockEditorSelector( 'isAncestorMultiSelected' );

/**
 * @see getMultiSelectedBlocksStartClientId in core/block-editor store.
 */
export const getMultiSelectedBlocksStartClientId = getBlockEditorSelector( 'getMultiSelectedBlocksStartClientId' );

/**
 * @see getMultiSelectedBlocksEndClientId in core/block-editor store.
 */
export const getMultiSelectedBlocksEndClientId = getBlockEditorSelector( 'getMultiSelectedBlocksEndClientId' );

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
export const hasSelectedInnerBlock = getBlockEditorSelector( 'hasSelectedInnerBlock' );

/**
 * @see isBlockWithinSelection in core/block-editor store.
 */
export const isBlockWithinSelection = getBlockEditorSelector( 'isBlockWithinSelection' );

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
export const isSelectionEnabled = getBlockEditorSelector( 'isSelectionEnabled' );

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
export const isCaretWithinFormattedText = getBlockEditorSelector( 'isCaretWithinFormattedText' );

/**
 * @see getBlockInsertionPoint in core/block-editor store.
 */
export const getBlockInsertionPoint = getBlockEditorSelector( 'getBlockInsertionPoint' );

/**
 * @see isBlockInsertionPointVisible in core/block-editor store.
 */
export const isBlockInsertionPointVisible = getBlockEditorSelector( 'isBlockInsertionPointVisible' );

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
export const canInsertBlockType = getBlockEditorSelector( 'canInsertBlockType' );

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
export const getBlockListSettings = getBlockEditorSelector( 'getBlockListSettings' );
