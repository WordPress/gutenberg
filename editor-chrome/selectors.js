/**
 * External dependencies
 */
import moment from 'moment';
import { get, values } from 'lodash';

/**
 * Internal dependencies
 */
import { addQueryArgs } from './utils/url';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Returns the current editing mode.
 *
 * @param  {Object} state Global application state
 * @return {String}       Editing mode
 */
export function getEditorMode( state ) {
	return state.mode;
}

/**
 * Returns the current active panel for the sidebar.
 *
 * @param  {Object}  state Global application state
 * @return {String}        Active sidebar panel
 */
export function getActivePanel( state ) {
	return state.panel;
}

/**
 * Returns true if the editor sidebar panel is open, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether sidebar is open
 */
export function isEditorSidebarOpened( state ) {
	return state.isSidebarOpened;
}

/**
 * Returns true if any past editor history snapshots exist, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether undo history exists
 */
export function hasEditorUndo( state ) {
	return state.editor.history.past.length > 0;
}

/**
 * Returns true if any future editor history snapshots exist, or false
 * otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether redo history exists
 */
export function hasEditorRedo( state ) {
	return state.editor.history.future.length > 0;
}

/**
 * Returns true if the currently edited post is yet to be saved, or false if
 * the post has been saved.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether the post is new
 */
export function isEditedPostNew( state ) {
	return getEditedPostAttribute( state, 'status' ) === 'auto-draft';
}

/**
 * Returns true if there are unsaved values for the current edit session, or
 * false if the editing state matches the saved or new post.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether unsaved values exist
 */
export function isEditedPostDirty( state ) {
	return state.editor.dirty;
}

/**
 * Returns true if there are no unsaved values for the current edit session and if
 * the currently edited post is new (and has never been saved before).
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether new post and unsaved values exist
 */
export function isCleanNewPost( state ) {
	return ! isEditedPostDirty( state ) && isEditedPostNew( state );
}

/**
 * Returns the post currently being edited in its last known saved state, not
 * including unsaved edits. Returns an object containing relevant default post
 * values if the post has not yet been saved.
 *
 * @param  {Object} state Global application state
 * @return {Object}       Post object
 */
export function getCurrentPost( state ) {
	return state.currentPost;
}

/**
 * Returns the post type of the post currently being edited
 *
 * @param  {Object} state Global application state
 * @return {String}       Post type
 */
export function getCurrentPostType( state ) {
	return state.currentPost.type;
}

/**
 * Returns the ID of the post currently being edited, or null if the post has
 * not yet been saved.
 *
 * @param  {Object}  state Global application state
 * @return {?Number}       ID of current post
 */
export function getCurrentPostId( state ) {
	return getCurrentPost( state ).id || null;
}

/**
 * Returns any post values which have been changed in the editor but not yet
 * been saved.
 *
 * @param  {Object} state Global application state
 * @return {Object}       Object of key value pairs comprising unsaved edits
 */
export function getPostEdits( state ) {
	return state.editor.edits;
}

/**
 * Returns a single attribute of the post being edited, preferring the unsaved
 * edit if one exists, but falling back to the attribute for the last known
 * saved state of the post.
 *
 * @param  {Object} state         Global application state
 * @param  {String} attributeName Post attribute name
 * @return {*}                    Post attribute value
 */
export function getEditedPostAttribute( state, attributeName ) {
	return state.editor.edits[ attributeName ] === undefined
		? state.currentPost[ attributeName ]
		: state.editor.edits[ attributeName ];
}

/**
 * Returns the current visibility of the post being edited, preferring the
 * unsaved value if different than the saved post. The return value is one of
 * "private", "password", or "public".
 *
 * @param  {Object} state Global application state
 * @return {String}       Post visibility
 */
export function getEditedPostVisibility( state ) {
	const status = getEditedPostAttribute( state, 'status' );
	const password = getEditedPostAttribute( state, 'password' );

	if ( status === 'private' ) {
		return 'private';
	} else if ( password ) {
		return 'password';
	}
	return 'public';
}

/**
 * Return true if the current post has already been published.
 *
 * @param  {Object}   state Global application state
 * @return {Boolean}        Whether the post has been published
 */
export function isCurrentPostPublished( state ) {
	const post = getCurrentPost( state );

	return [ 'publish', 'private' ].indexOf( post.status ) !== -1 ||
		( post.status === 'future' && moment( post.date ).isBefore( moment() ) );
}

/**
 * Return true if the post being edited can be published
 *
 * @param  {Object}   state Global application state
 * @return {Boolean}        Whether the post can been published
 */
export function isEditedPostPublishable( state ) {
	const post = getCurrentPost( state );
	return isEditedPostDirty( state ) || [ 'publish', 'private', 'future' ].indexOf( post.status ) === -1;
}

/**
 * Returns true if the post can be saved, or false otherwise. A post must
 * contain a title, an excerpt, or non-empty content to be valid for save.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether the post can be saved
 */
export function isEditedPostSaveable( state ) {
	return (
		getEditedPostAttribute( state, 'content' ) ||
		!! getEditedPostTitle( state ) ||
		!! getEditedPostExcerpt( state )
	);
}

/**
 * Return true if the post being edited is being scheduled. Preferring the
 * unsaved status values.
 *
 * @param  {Object}   state Global application state
 * @return {Boolean}        Whether the post has been published
 */
export function isEditedPostBeingScheduled( state ) {
	const date = getEditedPostAttribute( state, 'date' );
	return moment( date ).isAfter( moment() );
}

/**
 * Returns the raw title of the post being edited, preferring the unsaved value
 * if different than the saved post.
 *
 * @param  {Object} state Global application state
 * @return {String}       Raw post title
 */
export function getEditedPostTitle( state ) {
	const editedTitle = getPostEdits( state ).title;
	if ( editedTitle !== undefined ) {
		return editedTitle;
	}
	const currentPost = getCurrentPost( state );
	if ( currentPost.title && currentPost.title.raw ) {
		return currentPost.title.raw;
	}
	return '';
}

/**
 * Returns the raw content of the post being edited, preferring the unsaved value
 * if different than the saved post.
 *
 * @param  {Object} state Global application state
 * @return {String}       Raw post content
 */
export function getEditedPostContent( state ) {
	const editedContent = getPostEdits( state ).content;
	if ( editedContent !== undefined ) {
		return editedContent;
	}
	const currentPost = getCurrentPost( state );
	if ( currentPost.content && currentPost.content.raw ) {
		return currentPost.content.raw;
	}
	return '';
}

/**
 * Gets the document title to be used.
 *
 * @param  {Object}  state Global application state
 * @return {string}        Document title
 */
export function getDocumentTitle( state ) {
	let title = getEditedPostTitle( state );

	if ( ! title.trim() ) {
		title = isCleanNewPost( state ) ? __( 'New post' ) : __( '(Untitled)' );
	}
	return title;
}

/**
 * Returns the raw excerpt of the post being edited, preferring the unsaved
 * value if different than the saved post.
 *
 * @param  {Object} state Global application state
 * @return {String}       Raw post excerpt
 */
export function getEditedPostExcerpt( state ) {
	return state.editor.edits.excerpt === undefined
		? get( state.currentPost, 'excerpt.raw' )
		: state.editor.edits.excerpt;
}

/**
 * Returns a URL to preview the post being edited.
 *
 * @param  {Object} state Global application state
 * @return {String}       Preview URL
 */
export function getEditedPostPreviewLink( state ) {
	const link = state.currentPost.link;
	if ( ! link ) {
		return null;
	}

	return addQueryArgs( link, { preview: 'true' } );
}

/**
 * Returns true if the post is currently being saved, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether post is being saved
 */
export function isSavingPost( state ) {
	return state.saving.requesting;
}

/**
 * Returns true if a previous post save was attempted successfully, or false
 * otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether the post was saved successfully
 */
export function didPostSaveRequestSucceed( state ) {
	return state.saving.successful;
}

/**
 * Returns true if a previous post save was attempted but failed, or false
 * otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether the post save failed
 */
export function didPostSaveRequestFail( state ) {
	return !! state.saving.error;
}

/**
 * Returns a suggested post format for the current post, inferred only if there
 * is a single block within the post and it is of a type known to match a
 * default post format. Returns null if the format cannot be determined.
 *
 * @param  {Object}  state Global application state
 * @return {?String}       Suggested post format
 */
export function getSuggestedPostFormat( state ) {
	const blocks = state.editor.blockOrder;

	let name;
	// If there is only one block in the content of the post grab its name so
	// so we can derive a suitable post format from it.
	if ( blocks.length === 1 ) {
		name = state.editor.blocksByUid[ blocks[ 0 ] ].name;
	}

	// We only convert to default post formats in core.
	switch ( name ) {
		case 'core/image':
			return 'Image';
		case 'core/quote':
			return 'Quote';
	}

	return null;
}

/**
 * Returns the user notices array
 *
 * @param {Object} state Global application state
 * @return {Array}       List of notices
 */
export function getNotices( state ) {
	return values( state.notices );
}
