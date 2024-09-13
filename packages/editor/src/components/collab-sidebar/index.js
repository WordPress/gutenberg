/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch, resolveSelect } from '@wordpress/data';
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
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
import AddCommentButton from './commentButton';
import AddCommentToolbarButton from './commentButtonToolbar';

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
	const { getEntityRecords } = resolveSelect( coreStore );

	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { openGeneralSidebar } = useDispatch( 'core/edit-post' );
	const [ blockCommentID, setBlockCommentID] = useState( null );
	const [ showCommentBoard, setShowCommentBoard ] = useState( false );

	const [ threads, setThreads ] = useState( () => [] );
	const { postId } = useSelect( ( select ) => {
		return {
			postId: select( editorStore ).getCurrentPostId(),
		};
	}, [] );

	const clientId = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( blockEditorStore );
		setBlockCommentID( select( blockEditorStore ).getBlock( getSelectedBlockClientId() )?.attributes.blockCommentId );
		return getSelectedBlockClientId();
	}, [] );

	// Get the dispatch functions to save the comment and update the block attributes.
	const { updateBlockAttributes } = useDispatch( blockEditorStore );


	const openCollabBoard = () => {
		setShowCommentBoard( true );
		openGeneralSidebar( 'edit-post/collab-sidebar' );
	};

	// Function to save the comment.
	const addNewComment = async ( comment, parentCommentId ) => {
		const sanitisedComment = removep( comment );

		const args = {
			post: postId,
			content: sanitisedComment,
			comment_type: 'block_comment',
			comment_approved: 0,
		};

		if ( parentCommentId ) {
			args.parent = parentCommentId;
		}

		const savedRecord = await saveEntityRecord( 'root', 'comment', args );

		if ( savedRecord ) {
			// If it's a main comment, update the block attributes with the comment id.
			if ( ! parentCommentId ) {
				updateBlockAttributes( clientId, {
					blockCommentId: savedRecord?.id,
				} );
			}

			createNotice(
				'snackbar',
				parentCommentId
					? // translators: Reply added successfully
					  __( 'Reply added successfully.' )
					: // translators: Comment added successfully
					  __( 'Comment added successfully.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
			fetchComments();
		} else {
			onError();
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
		} else {
			onError();
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
		} else {
			onError();
		}
	};

	const onError = () => {
		createNotice(
			'error',
			// translators: Error message when comment submission fails
			__(
				'Something went wrong. Please try publishing the post, or you may have already submitted your comment earlier.'
			),
			{
				isDismissible: true,
			}
		);
	};

	const onCommentDelete = async ( commentId ) => {
		await deleteEntityRecord( 'root', 'comment', commentId );

		updateBlockAttributes( clientId, {
			blockCommentId: undefined,
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

	const fetchComments = useCallback( async () => {
		if ( postId ) {
			const data = await getEntityRecords( 'root', 'comment', {
				post: postId,
				type: 'block_comment',
				status: 'any',
				per_page: 100,
			} );

			if ( data ) {
				setThreads( Array.isArray( data ) ? data : [] );
			}
		}
	}, [ postId, getEntityRecords ] );

	useEffect( () => {
		fetchComments();
	}, [ postId, fetchComments ] );

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
	}, [ threads, allBlocks ] );

	// Check if the experimental flag is enabled.
	if ( ! isBlockCommentExperimentEnabled ) {
		return null; // or maybe return some message indicating no threads are available.
	}

	return (
		<>
			{ ! blockCommentID && (
				<AddCommentButton 
					onClick={openCollabBoard} 
				/>				
			)}

			{ blockCommentID > 0 && (
				<AddCommentToolbarButton 
					onClick={openCollabBoard} 
				/>
			)}
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
						showCommentBoard={ showCommentBoard }
						setShowCommentBoard={ setShowCommentBoard }
					/>
					<Comments
						threads={ resultComments }
						onEditComment={ onEditComment }
						onAddReply={ addNewComment }
						onCommentDelete={ onCommentDelete }
						onCommentResolve={ onCommentResolve }
					/>
				</div>
			</PluginSidebar>
		</>
	);
}
