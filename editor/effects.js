/**
 * External dependencies
 */
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import { get, uniqueId, map, filter, remove, some, includes, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { parse, getBlockType, switchToBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getPostEditUrl, getWPAdminURL } from './utils/url';
import {
	setSelection,
	resetPost,
	setupNewPost,
	resetBlocks,
	focusBlock,
	replaceBlocks,
	createSuccessNotice,
	createErrorNotice,
	removeNotice,
	savePost,
	editPost,
	requestMetaBoxUpdates,
} from './actions';
import {
	getCurrentPost,
	getCurrentPostType,
	getDirtyMetaBoxes,
	getEditedPostContent,
	getAllSelectedBlockUids,
	getPostEdits,
	isCurrentPostPublished,
	isEditedPostDirty,
	isEditedPostNew,
	isEditedPostSaveable,
	getMetaBoxes,
	getBlocksInRange,
} from './selectors';

const SAVE_POST_NOTICE_ID = 'SAVE_POST_NOTICE_ID';
const TRASH_POST_NOTICE_ID = 'TRASH_POST_NOTICE_ID';

export default {
	REQUEST_POST_UPDATE( action, store ) {
		const { dispatch, getState } = store;
		const state = getState();
		const post = getCurrentPost( state );
		const edits = getPostEdits( state );
		const toSend = {
			...edits,
			content: getEditedPostContent( state ),
			id: post.id,
		};
		const transactionId = uniqueId();

		dispatch( {
			type: 'UPDATE_POST',
			edits: toSend,
			optimist: { type: BEGIN, id: transactionId },
		} );
		dispatch( removeNotice( SAVE_POST_NOTICE_ID ) );
		const Model = wp.api.getPostTypeModel( getCurrentPostType( state ) );
		new Model( toSend ).save().done( ( newPost ) => {
			dispatch( {
				type: 'RESET_POST',
				post: newPost,
			} );
			dispatch( {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				previousPost: post,
				post: newPost,
				optimist: { type: COMMIT, id: transactionId },
			} );
		} ).fail( ( err ) => {
			dispatch( {
				type: 'REQUEST_POST_UPDATE_FAILURE',
				error: get( err, 'responseJSON', {
					code: 'unknown_error',
					message: __( 'An unknown error occurred.' ),
				} ),
				post,
				edits,
				optimist: { type: REVERT, id: transactionId },
			} );
		} );
	},
	REQUEST_POST_UPDATE_SUCCESS( action, store ) {
		const { previousPost, post } = action;
		const { dispatch, getState } = store;

		const publishStatus = [ 'publish', 'private', 'future' ];
		const isPublished = publishStatus.indexOf( previousPost.status ) !== -1;
		const messages = {
			publish: __( 'Post published!' ),
			private: __( 'Post published privately!' ),
			future: __( 'Post scheduled!' ),
		};

		// If we save a non published post, we don't show any notice
		// If we publish/schedule a post, we show the corresponding publish message
		// Unless we show an update notice
		if ( isPublished || publishStatus.indexOf( post.status ) !== -1 ) {
			const noticeMessage = ! isPublished && publishStatus.indexOf( post.status ) !== -1 ?
				messages[ post.status ] :
				__( 'Post updated!' );
			dispatch( createSuccessNotice(
				<p>
					<span>{ noticeMessage }</span>
					{ ' ' }
					<a href={ post.link }>{ __( 'View post' ) }</a>
				</p>,
				{ id: SAVE_POST_NOTICE_ID }
			) );
		}

		// Update dirty meta boxes.
		dispatch( requestMetaBoxUpdates( getDirtyMetaBoxes( getState() ) ) );

		if ( get( window.history.state, 'id' ) !== post.id ) {
			window.history.replaceState(
				{ id: post.id },
				'Post ' + post.id,
				getPostEditUrl( post.id )
			);
		}
	},
	REQUEST_POST_UPDATE_FAILURE( action, store ) {
		const { post, edits } = action;
		const { dispatch } = store;

		const publishStatus = [ 'publish', 'private', 'future' ];
		const isPublished = publishStatus.indexOf( post.status ) !== -1;
		// If the post was being published, we show the corresponding publish error message
		// Unless we publish an "updating failed" message
		const messages = {
			publish: __( 'Publishing failed' ),
			private: __( 'Publishing failed' ),
			future: __( 'Scheduling failed' ),
		};
		const noticeMessage = ! isPublished && publishStatus.indexOf( edits.status ) !== -1 ?
			messages[ edits.status ] :
			__( 'Updating failed' );
		dispatch( createErrorNotice( noticeMessage, { id: SAVE_POST_NOTICE_ID } ) );
	},
	TRASH_POST( action, store ) {
		const { dispatch, getState } = store;
		const { postId } = action;
		const Model = wp.api.getPostTypeModel( getCurrentPostType( getState() ) );
		dispatch( removeNotice( TRASH_POST_NOTICE_ID ) );
		new Model( { id: postId } ).destroy().then(
			() => {
				dispatch( {
					...action,
					type: 'TRASH_POST_SUCCESS',
				} );
			},
			( err ) => {
				dispatch( {
					...action,
					type: 'TRASH_POST_FAILURE',
					error: get( err, 'responseJSON', {
						code: 'unknown_error',
						message: __( 'An unknown error occurred.' ),
					} ),
				} );
			}
		);
	},
	TRASH_POST_SUCCESS( action ) {
		const { postId, postType } = action;

		// Delay redirect to ensure store has been updated with the successful trash.
		setTimeout( () => {
			window.location.href = getWPAdminURL( 'edit.php', {
				trashed: 1,
				post_type: postType,
				ids: postId,
			} );
		} );
	},
	TRASH_POST_FAILURE( action, store ) {
		const message = action.error.message && action.error.code !== 'unknown_error' ? action.error.message : __( 'Trashing failed' );
		store.dispatch( createErrorNotice( message, { id: TRASH_POST_NOTICE_ID } ) );
	},
	MERGE_BLOCKS( action, store ) {
		const { dispatch } = store;
		const [ blockA, blockB ] = action.blocks;
		const blockType = getBlockType( blockA.name );

		// Only focus the previous block if it's not mergeable
		if ( ! blockType.merge ) {
			dispatch( focusBlock( blockA.uid ) );
			return;
		}

		// We can only merge blocks with similar types
		// thus, we transform the block to merge first
		const blocksWithTheSameType = blockA.name === blockB.name ?
			[ blockB ] :
			switchToBlockType( blockB, blockA.name );

		// If the block types can not match, do nothing
		if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
			return;
		}

		// Calling the merge to update the attributes and remove the block to be merged
		const updatedAttributes = blockType.merge(
			blockA.attributes,
			blocksWithTheSameType[ 0 ].attributes
		);

		dispatch( focusBlock( blockA.uid, { offset: -1 } ) );
		dispatch( replaceBlocks(
			[ blockA.uid, blockB.uid ],
			[
				{
					...blockA,
					attributes: {
						...blockA.attributes,
						...updatedAttributes,
					},
				},
				...blocksWithTheSameType.slice( 1 ),
			]
		) );
	},
	AUTOSAVE( action, store ) {
		const { getState, dispatch } = store;
		const state = getState();
		if ( ! isEditedPostSaveable( state ) ) {
			return;
		}

		if ( ! isEditedPostNew( state ) && ! isEditedPostDirty( state ) ) {
			return;
		}

		if ( isCurrentPostPublished( state ) ) {
			// TODO: Publish autosave.
			//  - Autosaves are created as revisions for published posts, but
			//    the necessary REST API behavior does not yet exist
			//  - May need to check for whether the status of the edited post
			//    has changed from the saved copy (i.e. published -> pending)
			return;
		}

		// Change status from auto-draft to draft
		if ( isEditedPostNew( state ) ) {
			dispatch( editPost( { status: 'draft' } ) );
		}

		dispatch( savePost() );
	},
	SETUP_EDITOR( action ) {
		const { post } = action;
		const effects = [];

		// Parse content as blocks
		if ( post.content.raw ) {
			effects.push( resetBlocks( parse( post.content.raw ) ) );
		}

		// Resetting post should occur after blocks have been reset, since it's
		// the post reset that restarts history (used in dirty detection).
		effects.push( resetPost( post ) );

		// Include auto draft title in edits while not flagging post as dirty
		if ( post.status === 'auto-draft' ) {
			effects.push( setupNewPost( {
				title: post.title.raw,
			} ) );
		}

		return effects;
	},
	INITIALIZE_META_BOX_STATE( action ) {
		// Hold jquery.ready until the metaboxes load
		const locations = [ 'normal', 'side' ];
		if ( some( locations, ( location ) => !! action.metaBoxes[ location ] ) ) {
			jQuery.holdReady( true );
		}
	},
	META_BOX_LOADED( action, store ) {
		const { getState } = store;
		const metaboxes = getMetaBoxes( getState() );
		const unloadedMetaboxes = filter(
			map( metaboxes, ( value, key ) => ( {
				...value,
				key,
			} ) ),
			( metabox ) => metabox.isActive && ! metabox.isLoaded
		);
		if ( unloadedMetaboxes.length === 1 && unloadedMetaboxes[ 0 ].key === action.location ) {
			jQuery.holdReady( false );
		}
	},

	SPAWN_SELECTION( action, store ) {
		const { getState, dispatch } = store;
		console.log( 'spawn.state.lookup.pre', getState().blockSelection );
		// Take everything that is currently in the start->end range, and put it in selected
		const selectedUids = getAllSelectedBlockUids( getState() );
		console.log( 'spawn.state.lookup.post', selectedUids );
		const filteredUids = filter( selectedUids, ( uid ) => action.uid !== uid );
		console.log('spawning.initial', getState().blockSelection );
		dispatch( setSelection( action.uid, action.uid, filteredUids ) );
		console.log('spawning.result', getState( ).blockSelection );
	},

	TOGGLE_OFF_SELECTION( action, store ) {
		const { getState, dispatch } = store;


		const state = getState();
		console.log('toggling off', action.uid, state.blockSelection.selected );
		// If this is just in the selecteds, remove it.
		if ( includes( state.blockSelection.selected, action.uid ) ) {
			console.log(' should be clearing selection' );
			dispatch(
				setSelection( state.blockSelection.start, state.blockSelection.end, filter( state.blockSelection.selected, ( s ) => s !== action.uid ) )
			);
			return;
		}

		const inRange = getBlocksInRange( state.editor.present.blockOrder, state.blockSelection.start, state.blockSelection.end );
		if ( action.uid === state.blockSelection.start ) {
			const selectedUids = getAllSelectedBlockUids( getState() );
			const filteredUids = filter( selectedUids, ( uid ) => {
				return uid !== action.uid;
			} );
			const startUid = last( filteredUids );
			dispatch(
				setSelection( startUid, startUid, filteredUids.slice( 0, filteredUids.length - 1 ) )
			);
		} else if ( includes( inRange, action.uid ) ) {
			const selectedUids = getAllSelectedBlockUids( getState() );

			const filteredUids = filter( selectedUids, ( uid ) => {
				return uid !== action.uid && uid !== state.blockSelection.start;
			} );

			dispatch(
				setSelection( state.blockSelection.start, state.blockSelection.start, filteredUids )
			)

			// Make this the last anchor point.
		}

		// If this is in the range part, push all the range to selected, except start if different.

		// If this in the the range part, and is the start, push all the range to selected, and remove
		// the last one to be the next anchor
	},
};
