/**
 * External dependencies
 */
import moment from 'moment';
import {
	first,
	get,
	has,
	last,
	reduce,
	keys,
	without,
	compact,
	find,
} from 'lodash';
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import { serialize, getBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { BREAK_MEDIUM } from './constants';

/***
 * Module constants
 */
export const POST_UPDATE_TRANSACTION_ID = 'post-update';
const MAX_FREQUENT_BLOCKS = 3;

/**
 * Returns the current editing mode.
 *
 * @param  {Object} state Global application state
 * @return {String}       Editing mode
 */
export function getEditorMode( state ) {
	return getPreference( state, 'mode', 'visual' );
}

/**
 * Returns the state of legacy meta boxes.
 *
 * @param  {Object}  state Global application state
 * @return {Object}        State of meta boxes
 */
export function getMetaBoxes( state ) {
	return state.metaBoxes;
}

/**
 * Returns the state of legacy meta boxes.
 *
 * @param  {Object} state    Global application state
 * @param  {String} location Location of the meta box.
 * @return {Object}          State of meta box at specified location.
 */
export function getMetaBox( state, location ) {
	return getMetaBoxes( state )[ location ];
}

/**
 * Returns a list of dirty meta box locations.
 *
 * @param  {Object} state Global application state
 * @return {Array}        Array of locations for dirty meta boxes.
 */
export const getDirtyMetaBoxes = createSelector(
	( state ) => {
		return reduce( getMetaBoxes( state ), ( result, metaBox, location ) => {
			return metaBox.isDirty && metaBox.isActive ?
				[ ...result, location ] :
				result;
		}, [] );
	},
	( state ) => state.metaBoxes,
);

/**
 * Returns the dirty state of legacy meta boxes.
 *
 * Checks whether the entire meta box state is dirty. So if a sidebar is dirty,
 * but a normal area is not dirty, this will overall return dirty.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether state is dirty. True if dirty, false if not.
 */
export const isMetaBoxStateDirty = ( state ) => getDirtyMetaBoxes( state ).length > 0;

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
 * Returns the preferences (these preferences are persisted locally)
 *
 * @param  {Object}  state Global application state
 * @return {Object}        Preferences Object
 */
export function getPreferences( state ) {
	return state.preferences;
}

/**
 *
 * @param  {Object}  state          Global application state
 * @param  {String}  preferenceKey  Preference Key
 * @param  {Mixed}   defaultValue   Default Value
 * @return {Mixed}                  Preference Value
 */
export function getPreference( state, preferenceKey, defaultValue ) {
	const preferences = getPreferences( state );
	const value = preferences[ preferenceKey ];
	return value === undefined ? defaultValue : value;
}

/**
 * Returns true if the editor sidebar is open, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether sidebar is open
 */
export function isEditorSidebarOpened( state ) {
	return isMobile( state ) ?
		getPreference( state, 'isSidebarOpenedMobile' ) :
		getPreference( state, 'isSidebarOpened' );
}

/**
 * Returns true if the editor sidebar panel is open, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @param  {STring}  panel Sidebar panel name
 * @return {Boolean}       Whether sidebar is open
 */
export function isEditorSidebarPanelOpened( state, panel ) {
	const panels = getPreference( state, 'panels' );
	return panels ? !! panels[ panel ] : false;
}

/**
 * Returns true if any past editor history snapshots exist, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether undo history exists
 */
export function hasEditorUndo( state ) {
	return state.editor.past.length > 0;
}

/**
 * Returns true if any future editor history snapshots exist, or false
 * otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether redo history exists
 */
export function hasEditorRedo( state ) {
	return state.editor.future.length > 0;
}

/**
 * Returns true if the currently edited post is yet to be saved, or false if
 * the post has been saved.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether the post is new
 */
export function isEditedPostNew( state ) {
	return getCurrentPost( state ).status === 'auto-draft';
}

/**
 * Returns true if there are unsaved values for the current edit session, or
 * false if the editing state matches the saved or new post.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether unsaved values exist
 */
export function isEditedPostDirty( state ) {
	return state.editor.isDirty || isMetaBoxStateDirty( state );
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
 * Returns true if the current window size corresponds to mobile resolutions (<= medium breakpoint)
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether current window size corresponds to mobile resolutions
 */
export function isMobile( state ) {
	return state.browser.width < BREAK_MEDIUM;
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
 * Returns the number of revisions of the post currently being edited.
 *
 * @param  {Object}  state Global application state
 * @return {Number}        Number of revisions
 */
export function getCurrentPostRevisionsCount( state ) {
	return get( getCurrentPost( state ), 'revisions.count', 0 );
}

/**
 * Returns the last revision ID of the post currently being edited,
 * or null if the post has no revisions.
 *
 * @param  {Object}  state Global application state
 * @return {?Number}       ID of the last revision
 */
export function getCurrentPostLastRevisionId( state ) {
	return get( getCurrentPost( state ), 'revisions.last_id', null );
}

/**
 * Returns any post values which have been changed in the editor but not yet
 * been saved.
 *
 * @param  {Object} state Global application state
 * @return {Object}       Object of key value pairs comprising unsaved edits
 */
export function getPostEdits( state ) {
	return state.editor.present.edits;
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
	return state.editor.present.edits[ attributeName ] === undefined ?
		state.currentPost[ attributeName ] :
		state.editor.present.edits[ attributeName ];
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
		!! getEditedPostTitle( state ) ||
		!! getEditedPostExcerpt( state ) ||
		!! getEditedPostContent( state )
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
	// Adding 1 minute as an error threshold between the server and the client dates.
	const now = moment().add( 1, 'minute' );

	return moment( date ).isAfter( now );
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
	if ( currentPost.title && currentPost.title ) {
		return currentPost.title;
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
	return state.editor.present.edits.excerpt === undefined ?
		state.currentPost.excerpt :
		state.editor.present.edits.excerpt;
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
 * Returns a block given its unique ID. This is a parsed copy of the block,
 * containing its `blockName`, identifier (`uid`), and current `attributes`
 * state. This is not the block's registration settings, which must be
 * retrieved from the blocks module registration store.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Object}       Parsed block object
 */
export const getBlock = createSelector(
	( state, uid ) => {
		const block = state.editor.present.blocksByUid[ uid ];
		if ( ! block ) {
			return null;
		}

		const type = getBlockType( block.name );
		if ( ! type || ! type.attributes ) {
			return block;
		}

		const metaAttributes = reduce( type.attributes, ( result, value, key ) => {
			if ( value.source === 'meta' ) {
				result[ key ] = getPostMeta( state, value.meta );
			}

			return result;
		}, {} );

		if ( ! Object.keys( metaAttributes ).length ) {
			return block;
		}

		return {
			...block,
			attributes: {
				...block.attributes,
				...metaAttributes,
			},
		};
	},
	( state, uid ) => [
		get( state, [ 'editor', 'present', 'blocksByUid', uid ] ),
		get( state, [ 'editor', 'present', 'edits', 'meta' ] ),
		get( state, 'currentPost.meta' ),
	]
);

function getPostMeta( state, key ) {
	return has( state, [ 'editor', 'present', 'edits', 'meta', key ] ) ?
		get( state, [ 'editor', 'present', 'edits', 'meta', key ] ) :
		get( state, [ 'currentPost', 'meta', key ] );
}

/**
 * Returns all block objects for the current post being edited as an array in
 * the order they appear in the post.
 * Note: It's important to memoize this selector to avoid return a new instance on each call
 *
 * @param  {Object}   state Global application state
 * @return {Object[]}       Post blocks
 */
export const getBlocks = createSelector(
	( state ) => {
		return state.editor.present.blockOrder.map( ( uid ) => getBlock( state, uid ) );
	},
	( state ) => [
		state.editor.present.blockOrder,
		state.editor.present.blocksByUid,
	]
);

/**
 * Returns the number of blocks currently present in the post.
 *
 * @param  {Object} state Global application state
 * @return {Number}       Number of blocks in the post
 */
export function getBlockCount( state ) {
	return getBlockUids( state ).length;
}

/**
 * Returns the number of blocks currently selected in the post.
 *
 * @param  {Object} state Global application state
 * @return {Number}       Number of blocks selected in the post
 */
export function getSelectedBlockCount( state ) {
	const multiSelectedBlockCount = getMultiSelectedBlockUids( state ).length;

	if ( multiSelectedBlockCount ) {
		return multiSelectedBlockCount;
	}

	return state.blockSelection.start ? 1 : 0;
}

/**
 * Returns the currently selected block, or null if there is no selected block.
 *
 * @param  {Object}  state Global application state
 * @return {?Object}       Selected block
 */
export function getSelectedBlock( state ) {
	const { start, end } = state.blockSelection;
	if ( start !== end || ! start ) {
		return null;
	}

	return getBlock( state, start );
}

/**
 * Returns the current multi-selection set of blocks unique IDs, or an empty
 * array if there is no multi-selection.
 *
 * @param  {Object} state Global application state
 * @return {Array}        Multi-selected block unique UDs
 */
export const getMultiSelectedBlockUids = createSelector(
	( state ) => {
		const { blockOrder } = state.editor.present;
		const { start, end } = state.blockSelection;
		if ( start === end ) {
			return [];
		}

		const startIndex = blockOrder.indexOf( start );
		const endIndex = blockOrder.indexOf( end );

		if ( startIndex > endIndex ) {
			return blockOrder.slice( endIndex, startIndex + 1 );
		}

		return blockOrder.slice( startIndex, endIndex + 1 );
	},
	( state ) => [
		state.editor.present.blockOrder,
		state.blockSelection.start,
		state.blockSelection.end,
	],
);

/**
 * Returns the current multi-selection set of blocks, or an empty array if
 * there is no multi-selection.
 *
 * @param  {Object} state Global application state
 * @return {Array}        Multi-selected block objects
 */
export const getMultiSelectedBlocks = createSelector(
	( state ) => getMultiSelectedBlockUids( state ).map( ( uid ) => getBlock( state, uid ) ),
	( state ) => [
		state.editor.present.blockOrder,
		state.blockSelection.start,
		state.blockSelection.end,
		state.editor.present.blocksByUid,
		state.editor.present.edits.meta,
		state.currentPost.meta,
	]
);

/**
 * Returns the unique ID of the first block in the multi-selection set, or null
 * if there is no multi-selection.
 *
 * @param  {Object}  state Global application state
 * @return {?String}       First unique block ID in the multi-selection set
 */
export function getFirstMultiSelectedBlockUid( state ) {
	return first( getMultiSelectedBlockUids( state ) ) || null;
}

/**
 * Returns the unique ID of the last block in the multi-selection set, or null
 * if there is no multi-selection.
 *
 * @param  {Object}  state Global application state
 * @return {?String}       Last unique block ID in the multi-selection set
 */
export function getLastMultiSelectedBlockUid( state ) {
	return last( getMultiSelectedBlockUids( state ) ) || null;
}

/**
 * Returns true if a multi-selection exists, and the block corresponding to the
 * specified unique ID is the first block of the multi-selection set, or false
 * otherwise.
 *
 * @param  {Object}  state Global application state
 * @param  {String}  uid   Block unique ID
 * @return {Boolean}       Whether block is first in mult-selection
 */
export function isFirstMultiSelectedBlock( state, uid ) {
	return getFirstMultiSelectedBlockUid( state ) === uid;
}

/**
 * Returns true if the unique ID occurs within the block multi-selection, or
 * false otherwise.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Boolean}      Whether block is in multi-selection set
 */
export function isBlockMultiSelected( state, uid ) {
	return getMultiSelectedBlockUids( state ).indexOf( uid ) !== -1;
}

/**
 * Returns the unique ID of the block which begins the multi-selection set, or
 * null if there is no multi-selection.
 *
 * N.b.: This is not necessarily the first uid in the selection. See
 * getFirstMultiSelectedBlockUid().
 *
 * @param  {Object}  state Global application state
 * @return {?String}       Unique ID of block beginning multi-selection
 */
export function getMultiSelectedBlocksStartUid( state ) {
	const { start, end } = state.blockSelection;
	if ( start === end ) {
		return null;
	}
	return start || null;
}

/**
 * Returns the unique ID of the block which ends the multi-selection set, or
 * null if there is no multi-selection.
 *
 * N.b.: This is not necessarily the last uid in the selection. See
 * getLastMultiSelectedBlockUid().
 *
 * @param  {Object}  state Global application state
 * @return {?String}       Unique ID of block ending multi-selection
 */
export function getMultiSelectedBlocksEndUid( state ) {
	const { start, end } = state.blockSelection;
	if ( start === end ) {
		return null;
	}
	return end || null;
}

/**
 * Returns an array containing all block unique IDs of the post being edited,
 * in the order they appear in the post.
 *
 * @param  {Object} state Global application state
 * @return {Array}        Ordered unique IDs of post blocks
 */
export function getBlockUids( state ) {
	return state.editor.present.blockOrder;
}

/**
 * Returns the index at which the block corresponding to the specified unique
 * ID occurs within the post block order, or `-1` if the block does not exist.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Number}       Index at which block exists in order
 */
export function getBlockIndex( state, uid ) {
	return state.editor.present.blockOrder.indexOf( uid );
}

/**
 * Returns true if the block corresponding to the specified unique ID is the
 * first block of the post, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @param  {String}  uid   Block unique ID
 * @return {Boolean}       Whether block is first in post
 */
export function isFirstBlock( state, uid ) {
	return first( state.editor.present.blockOrder ) === uid;
}

/**
 * Returns true if the block corresponding to the specified unique ID is the
 * last block of the post, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @param  {String}  uid   Block unique ID
 * @return {Boolean}       Whether block is last in post
 */
export function isLastBlock( state, uid ) {
	return last( state.editor.present.blockOrder ) === uid;
}

/**
 * Returns the block object occurring before the one corresponding to the
 * specified unique ID.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Object}       Block occurring before specified unique ID
 */
export function getPreviousBlock( state, uid ) {
	const order = getBlockIndex( state, uid );
	return state.editor.present.blocksByUid[ state.editor.present.blockOrder[ order - 1 ] ] || null;
}

/**
 * Returns the block object occurring after the one corresponding to the
 * specified unique ID.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Object}       Block occurring after specified unique ID
 */
export function getNextBlock( state, uid ) {
	const order = getBlockIndex( state, uid );
	return state.editor.present.blocksByUid[ state.editor.present.blockOrder[ order + 1 ] ] || null;
}

/**
 * Returns true if the block corresponding to the specified unique ID is
 * currently selected and no multi-selection exists, or false otherwise.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Boolean}      Whether block is selected and multi-selection exists
 */
export function isBlockSelected( state, uid ) {
	const { start, end } = state.blockSelection;

	if ( start !== end ) {
		return false;
	}

	return start === uid;
}

/**
 * Returns true if the block corresponding to the specified unique ID is
 * currently selected but isn't the last of the selected blocks. Here "last"
 * refers to the block sequence in the document, _not_ the sequence of
 * multi-selection, which is why `state.blockSelection.end` isn't used.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Boolean}      Whether block is selected and not the last in the selection
 */
export function isBlockWithinSelection( state, uid ) {
	if ( ! uid ) {
		return false;
	}

	const uids = getMultiSelectedBlockUids( state );
	const index = uids.indexOf( uid );
	return index > -1 && index < uids.length - 1;
}

/**
 * Returns true if the cursor is hovering the block corresponding to the
 * specified unique ID, or false otherwise.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Boolean}      Whether block is hovered
 */
export function isBlockHovered( state, uid ) {
	return state.hoveredBlock === uid;
}

/**
 * Returns focus state of the block corresponding to the specified unique ID,
 * or null if the block is not selected. It is left to a block's implementation
 * to manage the content of this object, defaulting to an empty object.
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Object}       Block focus state
 */
export function getBlockFocus( state, uid ) {
	// If there is multi-selection, keep returning the focus object for the start block.
	if ( ! isBlockSelected( state, uid ) && state.blockSelection.start !== uid ) {
		return null;
	}

	return state.blockSelection.focus;
}

/**
 * Whether in the process of multi-selecting or not.
 *
 * @param  {Object} state Global application state
 * @return {Boolean}      True if multi-selecting, false if not.
 */
export function isMultiSelecting( state ) {
	return state.blockSelection.isMultiSelecting;
}

/**
 * Whether is selection disable or not.
 *
 * @param  {Object} state Global application state
 * @return {Boolean}      True if multi is disable, false if not.
 */
export function isSelectionEnabled( state ) {
	return state.blockSelection.isEnabled;
}

/**
 * Returns thee block's editing mode
 *
 * @param  {Object} state Global application state
 * @param  {String} uid   Block unique ID
 * @return {Object}       Block editing mode
 */
export function getBlockMode( state, uid ) {
	return state.blocksMode[ uid ] || 'visual';
}

/**
 * Returns true if the user is typing, or false otherwise.
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether user is typing
 */
export function isTyping( state ) {
	return state.isTyping;
}

/**
 * Returns the insertion point, the index at which the new inserted block would
 * be placed. Defaults to the last position
 *
 * @param  {Object}  state Global application state
 * @return {?String}       Unique ID after which insertion will occur
 */
export function getBlockInsertionPoint( state ) {
	if ( getEditorMode( state ) !== 'visual' ) {
		return state.editor.present.blockOrder.length;
	}

	const position = getBlockSiblingInserterPosition( state );
	if ( null !== position ) {
		return position;
	}

	const lastMultiSelectedBlock = getLastMultiSelectedBlockUid( state );
	if ( lastMultiSelectedBlock ) {
		return getBlockIndex( state, lastMultiSelectedBlock ) + 1;
	}

	const selectedBlock = getSelectedBlock( state );
	if ( selectedBlock ) {
		return getBlockIndex( state, selectedBlock.uid ) + 1;
	}

	return state.editor.present.blockOrder.length;
}

/**
 * Returns the position at which the block inserter will insert a new adjacent
 * sibling block, or null if the inserter is not actively visible.
 *
 * @param  {Object}  state Global application state
 * @return {?Number}       Whether the inserter is currently visible
 */
export function getBlockSiblingInserterPosition( state ) {
	const { position } = state.blockInsertionPoint;
	if ( ! Number.isInteger( position ) ) {
		return null;
	}

	return position;
}

/**
 * Returns true if we should show the block insertion point
 *
 * @param  {Object}  state Global application state
 * @return {?Boolean}      Whether the insertion point is visible or not
 */
export function isBlockInsertionPointVisible( state ) {
	return !! state.blockInsertionPoint.visible;
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
	const blocks = state.editor.present.blockOrder;

	let name;
	// If there is only one block in the content of the post grab its name
	// so we can derive a suitable post format from it.
	if ( blocks.length === 1 ) {
		name = state.editor.present.blocksByUid[ blocks[ 0 ] ].name;
	}

	// If there are two blocks in the content and the last one is a text blocks
	// grab the name of the first one to also suggest a post format from it.
	if ( blocks.length === 2 ) {
		if ( state.editor.present.blocksByUid[ blocks[ 1 ] ].name === 'core/paragraph' ) {
			name = state.editor.present.blocksByUid[ blocks[ 0 ] ].name;
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
 * Returns the content of the post being edited, preferring raw string edit
 * before falling back to serialization of block state.
 *
 * @param  {Object} state Global application state
 * @return {String}       Post content
 */
export const getEditedPostContent = createSelector(
	( state ) => {
		const edits = getPostEdits( state );
		if ( 'content' in edits ) {
			return edits.content;
		}

		return serialize( getBlocks( state ) );
	},
	( state ) => [
		state.editor.present.edits.content,
		state.editor.present.blocksByUid,
		state.editor.present.blockOrder,
	],
);

/**
 * Returns the user notices array
 *
 * @param {Object} state Global application state
 * @return {Array}       List of notices
 */
export function getNotices( state ) {
	return state.notices;
}

/**
 * Resolves the list of recently used block names into a list of block type settings.
 *
 * @param {Object} state Global application state
 * @return {Array}       List of recently used blocks
 */
export function getRecentlyUsedBlocks( state ) {
	// resolves the block names in the state to the block type settings
	return compact( state.preferences.recentlyUsedBlocks.map( blockType => getBlockType( blockType ) ) );
}

/**
 * Resolves the block usage stats into a list of the most frequently used blocks.
 * Memoized so we're not generating block lists every time we render the list
 * in the inserter.
 *
 * @param {Object} state Global application state
 * @return {Array}       List of block type settings
 */
export const getMostFrequentlyUsedBlocks = createSelector(
	( state ) => {
		const { blockUsage } = state.preferences;
		const orderedByUsage = keys( blockUsage ).sort( ( a, b ) => blockUsage[ b ] - blockUsage[ a ] );
		// add in paragraph and image blocks if they're not already in the usage data
		return compact(
			[ ...orderedByUsage, ...without( [ 'core/paragraph', 'core/image' ], ...orderedByUsage ) ]
				.map( blockType => getBlockType( blockType ) )
		).slice( 0, MAX_FREQUENT_BLOCKS );
	},
	( state ) => state.preferences.blockUsage
);

/**
 * Returns whether the given feature is enabled or not
 *
 * @param {Object}    state   Global application state
 * @param {String}    feature Feature slug
 * @return {Booleean}         Is active
 */
export function isFeatureActive( state, feature ) {
	return !! state.preferences.features[ feature ];
}

/**
 * Returns the reusable block with the given ID.
 *
 * @param {Object} state Global application state
 * @param {String} ref   The reusable block's ID
 * @return {Object}      The reusable block, or null if none exists
 */
export function getReusableBlock( state, ref ) {
	return state.reusableBlocks.data[ ref ] || null;
}

/**
 * Returns whether or not the reusable block with the given ID is being saved.
 *
 * @param {*} state  Global application state
 * @param {*} ref    The reusable block's ID
 * @return {Boolean} Whether or not the reusable block is being saved
 */
export function isSavingReusableBlock( state, ref ) {
	return state.reusableBlocks.isSaving[ ref ] || false;
}

/**
 * Returns an array of all reusable blocks.
 *
 * @param {Object} state Global application state
 * @return {Array}       An array of all reusable blocks.
 */
export function getReusableBlocks( state ) {
	return Object.values( state.reusableBlocks.data );
}

/**
 * Returns state object prior to a specified optimist transaction ID, or `null`
 * if the transaction corresponding to the given ID cannot be found.
 *
 * @param  {Object} state         Current global application state
 * @param  {Object} transactionId Optimist transaction ID
 * @return {Object}               Global application state prior to transaction
 */
export function getStateBeforeOptimisticTransaction( state, transactionId ) {
	const transaction = find( state.optimist, ( entry ) => (
		entry.beforeState &&
		get( entry.action, [ 'optimist', 'id' ] ) === transactionId
	) );

	return transaction ? transaction.beforeState : null;
}

/**
 * Returns true if the post is being published, or false otherwise
 *
 * @param  {Object}  state Global application state
 * @return {Boolean}       Whether post is being published
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
