/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { comment as commentIcon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { removep } from '@wordpress/autop';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import { collabSidebarName } from './constants';
import { Comments } from './comments';
import { AddComment } from './add-comment';
import { store as editorStore } from '../../store';

const isBlockCommentExperimentEnabled =
	window?.__experimentalEnableBlockComment;
const modifyBlockCommentAttributes = ( settings, name ) => {
	if ( name?.includes( 'core/' ) && ! settings.attributes.blockCommentId ) {
		settings.attributes = {
			...settings.attributes,
			blockCommentId: {
				type: 'number',
				default: 0,
			},
			showCommentBoard: {
				type: 'boolean',
				default: false,
			},
		};
	}

	return settings;
};

// Apply the filter to all core blocks
addFilter(
	'blocks.registerBlockType',
	'block-comment/modify-core-block-attributes',
	modifyBlockCommentAttributes
);

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );

	const [ threads, setThreads ] = useState( () => [] );
	const postId = useSelect( ( select ) => {
		return select( editorStore ).getCurrentPostId();
	}, [] );

	const currentUserData = useSelect( ( select ) => {
		return select( coreStore ).getCurrentUser();
	}, [] );

	// Get the dispatch functions to save the comment and update the block attributes.
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const clientId = useSelect( ( select ) => {
		return select( blockEditorStore ).getSelectedBlockClientId();
	}, [] );

	// Function to save the comment.
	const addNewComment = async ( comment ) => {
		const savedRecord = await saveEntityRecord( 'root', 'comment', {
			post: postId,
			content: comment,
			comment_date: new Date().toISOString(),
			comment_type: 'block_comment',
			comment_author: currentUserData?.name ?? null,
			comment_approved: 0,
		} );

		if ( savedRecord ) {
			updateBlockAttributes( clientId, {
				blockCommentId: savedRecord?.id,
			} );
			createNotice( 'snackbar', __( 'New comment added.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
			fetchComments();
		}
	};

	const onCommentResolve = async ( commentId ) => {
		const savedRecord = await saveEntityRecord( 'root', 'comment', {
			id: commentId,
			status: 'approved',
		} );

		if ( savedRecord ) {
			// translators: Comment resolved successfully
			createNotice( 'snackbar', __( 'Thread marked as resolved.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );

			fetchComments();
		}
	};

	const onEditComment = async ( commentId, comment ) => {
		const editedComment = removep( comment );

		const savedRecord = await saveEntityRecord( 'root', 'comment', {
			id: commentId,
			content: editedComment,
		} );

		if ( savedRecord ) {
			createNotice(
				'snackbar',
				// translators: Comment edited successfully
				__( 'Thread edited successfully.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);

			fetchComments();
		}
	};

	const onAddReply = async ( parentCommentId, comment ) => {
		const sanitisedComment = removep( comment );

		const savedRecord = await saveEntityRecord( 'root', 'comment', {
			parent: parentCommentId,
			post: postId,
			content: sanitisedComment,
			comment_date: new Date().toISOString(),
			comment_type: 'block_comment',
			comment_author: currentUserData?.name ?? null,
			comment_approved: 0,
		} );

		if ( savedRecord ) {
			createNotice(
				'snackbar',
				// translators: Reply added successfully
				__( 'Reply added successfully.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
			fetchComments();
		}
	};

	const onCommentDelete = async ( commentId ) => {
		await deleteEntityRecord( 'root', 'comment', commentId );

		updateBlockAttributes( clientId, {
			blockCommentId: undefined,
			showCommentBoard: undefined,
		} );

		createNotice(
			'snackbar',
			// translators: Comment deleted successfully
			__( 'Thread deleted successfully.' ),
			{
				type: 'snackbar',
				isDismissible: true,
			}
		);
		fetchComments();
	};

	const fetchComments = () => {
		if ( postId ) {
			apiFetch( {
				path:
					'/wp/v2/comments?post=' +
					postId +
					'&type=block_comment' +
					'&status=any&per_page=100',
				method: 'GET',
			} ).then( ( data ) => {
				setThreads( Array.isArray( data ) ? data : [] );
			} );
		}
	};

	useEffect( () => {
		fetchComments();
	}, [ postId ] );

	const allBlocks = useSelect( ( select ) => {
		return select( blockEditorStore ).getBlocks();
	}, [] );

	// Process comments to build the tree structure
	const resultComments = useMemo( () => {
		// Create a compare to store the references to all objects by id
		const compare = {};
		const result = [];

		const filteredComments = threads.filter(
			( comment ) => comment.status !== 'trash'
		);

		// Initialize each object with an empty `reply` array
		filteredComments.forEach( ( item ) => {
			compare[ item.id ] = { ...item, reply: [] };
		} );

		// Iterate over the data to build the tree structure
		filteredComments.forEach( ( item ) => {
			if ( item.parent === 0 ) {
				// If parent is 0, it's a root item, push it to the result array
				result.push( compare[ item.id ] );
			} else if ( compare[ item.parent ] ) {
				// Otherwise, find its parent and push it to the parent's `reply` array
				compare[ item.parent ].reply.push( compare[ item.id ] );
			}
		} );

		const filteredBlocks = allBlocks?.filter(
			( block ) => block.attributes.blockCommentId !== 0
		);

		const blockCommentIds = filteredBlocks?.map(
			( block ) => block.attributes.blockCommentId
		);
		const threadIdMap = new Map(
			result?.map( ( thread ) => [ thread.id, thread ] )
		);
		const sortedThreads = blockCommentIds
			.map( ( id ) => threadIdMap.get( id ) )
			.filter( ( thread ) => thread !== undefined );

		return sortedThreads;
	}, [ threads ] );

	// Check if the experimental flag is enabled.
	if ( ! isBlockCommentExperimentEnabled ) {
		return null; // or maybe return some message indicating no threads are available.
	}

	return (
		<PluginSidebar
			identifier={ collabSidebarName }
			// translators: Comments sidebar title
			title={ __( 'Comments' ) }
			icon={ commentIcon }
		>
			<div className="editor-collab-sidebar-panel">
				<AddComment
					threads={ resultComments }
					onSubmit={ addNewComment }
				/>
				<Comments
					threads={ resultComments }
					onEditComment={ onEditComment }
					onAddReply={ onAddReply }
					onCommentDelete={ onCommentDelete }
					onCommentResolve={ onCommentResolve }
				/>
			</div>
		</PluginSidebar>
	);
}
