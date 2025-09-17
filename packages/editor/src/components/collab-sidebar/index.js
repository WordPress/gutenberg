/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useSelect,
	useDispatch,
	resolveSelect,
	subscribe,
} from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { comment as commentIcon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';
import { store as noticesStore } from '@wordpress/notices';
import {
	store as coreStore,
	useEntityBlockEditor,
	useEntityRecords,
} from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import { collabHistorySidebarName, collabSidebarName } from './constants';
import { Comments } from './comments';
import { AddComment } from './add-comment';
import { store as editorStore } from '../../store';
import AddCommentButton from './comment-button';
import CommentAvatarIndicator from './comment-indicator-toolbar';
import { useGlobalStylesContext } from '../global-styles-provider';
import { getCommentIdsFromBlocks } from './utils';

const modifyBlockCommentAttributes = ( settings ) => {
	if ( ! settings.attributes.blockCommentId ) {
		settings.attributes = {
			...settings.attributes,
			blockCommentId: {
				type: 'number',
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

function CollabSidebarContent( {
	showCommentBoard,
	setShowCommentBoard,
	styles,
	comments,
} ) {
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const { getEntityRecord } = resolveSelect( coreStore );

	const { postId } = useSelect( ( select ) => {
		const { getCurrentPostId } = select( editorStore );
		const _postId = getCurrentPostId();

		return {
			postId: _postId,
		};
	}, [] );

	const { getSelectedBlockClientId } = useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const onError = ( error ) => {
		const errorMessage =
			error.message && error.code !== 'unknown_error'
				? error.message
				: __( 'An error occurred while performing an update.' );
		createNotice( 'error', errorMessage, {
			type: 'snackbar',
			isDismissible: true,
		} );
	};

	const addNewComment = async ( comment, parentCommentId ) => {
		try {
			const savedRecord = await saveEntityRecord(
				'root',
				'comment',
				{
					post: postId,
					content: comment,
					comment_type: 'block_comment',
					comment_approved: 0,
					...( parentCommentId ? { parent: parentCommentId } : {} ),
				},
				{ throwOnError: true }
			);

			// If it's a main comment, update the block attributes with the comment id.
			if ( ! parentCommentId && savedRecord?.id ) {
				updateBlockAttributes( getSelectedBlockClientId(), {
					blockCommentId: savedRecord.id,
				} );
			}

			createNotice(
				'snackbar',
				parentCommentId
					? __( 'Reply added successfully.' )
					: __( 'Comment added successfully.' ),
				{
					type: 'snackbar',
					isDismissible: true,
				}
			);
		} catch ( error ) {
			onError( error );
		}
	};

	const onCommentResolve = async ( commentId ) => {
		try {
			await saveEntityRecord(
				'root',
				'comment',
				{
					id: commentId,
					status: 'approved',
				},
				{ throwOnError: true }
			);
			createNotice( 'snackbar', __( 'Comment marked as resolved.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		} catch ( error ) {
			onError( error );
		}
	};

	const onCommentReopen = async ( commentId ) => {
		try {
			await saveEntityRecord(
				'root',
				'comment',
				{
					id: commentId,
					status: 'hold',
				},
				{ throwOnError: true }
			);
			createNotice( 'snackbar', __( 'Comment reopened.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		} catch ( error ) {
			onError( error );
		}
	};

	const onEditComment = async ( commentId, comment ) => {
		try {
			await saveEntityRecord(
				'root',
				'comment',
				{
					id: commentId,
					content: comment,
				},
				{ throwOnError: true }
			);
			createNotice( 'snackbar', __( 'Comment edited successfully.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		} catch ( error ) {
			onError( error );
		}
	};

	const onCommentDelete = async ( commentId ) => {
		try {
			const childComment = await getEntityRecord(
				'root',
				'comment',
				commentId
			);
			await deleteEntityRecord( 'root', 'comment', commentId, undefined, {
				throwOnError: true,
			} );

			if ( childComment && ! childComment.parent ) {
				updateBlockAttributes( getSelectedBlockClientId(), {
					blockCommentId: undefined,
				} );
			}

			createNotice( 'snackbar', __( 'Comment deleted successfully.' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		} catch ( error ) {
			onError( error );
		}
	};

	return (
		<div className="editor-collab-sidebar-panel" style={ styles }>
			<AddComment
				onSubmit={ addNewComment }
				showCommentBoard={ showCommentBoard }
				setShowCommentBoard={ setShowCommentBoard }
			/>
			<Comments
				key={ getSelectedBlockClientId() }
				threads={ comments }
				onEditComment={ onEditComment }
				onAddReply={ addNewComment }
				onCommentDelete={ onCommentDelete }
				onCommentResolve={ onCommentResolve }
				onCommentReopen={ onCommentReopen }
				showCommentBoard={ showCommentBoard }
				setShowCommentBoard={ setShowCommentBoard }
			/>
		</div>
	);
}

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	const [ showCommentBoard, setShowCommentBoard ] = useState( false );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );

	const { postId, postType } = useSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPostType } = select( editorStore );
		return {
			postId: getCurrentPostId(),
			postType: getCurrentPostType(),
		};
	}, [] );

	const queryArgs = {
		post: postId,
		type: 'block_comment',
		status: 'all',
		per_page: 100,
	};

	const { records: threads, totalPages } = useEntityRecords(
		'root',
		'comment',
		queryArgs,
		{ enabled: !! postId && typeof postId === 'number' }
	);

	const hasMoreComments = totalPages && totalPages > 1;

	const { blockCommentId } = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId } =
			select( blockEditorStore );
		const _clientId = getSelectedBlockClientId();

		return {
			blockCommentId: _clientId
				? getBlockAttributes( _clientId )?.blockCommentId
				: null,
		};
	}, [] );

	const openCollabBoard = () => {
		setShowCommentBoard( true );
		enableComplementaryArea( 'core', collabHistorySidebarName );
	};

	const [ blocks ] = useEntityBlockEditor( 'postType', postType, {
		id: postId,
	} );

	// Process comments to build the tree structure.
	const { resultComments, unresolvedSortedThreads } = useMemo( () => {
		// Create a compare to store the references to all objects by id.
		const compare = {};
		const result = [];

		const allComments = threads ?? [];

		// Initialize each object with an empty `reply` array.
		allComments.forEach( ( item ) => {
			compare[ item.id ] = { ...item, reply: [] };
		} );

		// Iterate over the data to build the tree structure.
		allComments.forEach( ( item ) => {
			if ( item.parent === 0 ) {
				// If parent is 0, it's a root item, push it to the result array.
				result.push( compare[ item.id ] );
			} else if ( compare[ item.parent ] ) {
				// Otherwise, find its parent and push it to the parent's `reply` array.
				compare[ item.parent ].reply.push( compare[ item.id ] );
			}
		} );

		if ( 0 === result?.length ) {
			return { resultComments: [], unresolvedSortedThreads: [] };
		}

		const updatedResult = result.map( ( item ) => ( {
			...item,
			reply: [ ...item.reply ].reverse(),
		} ) );

		const blockCommentIds = getCommentIdsFromBlocks( blocks );

		const threadIdMap = new Map(
			updatedResult.map( ( thread ) => [ thread.id, thread ] )
		);

		// Get comments by block order, filter out undefined threads, and exclude resolved comments.
		const unresolvedSortedComments = blockCommentIds
			.map( ( id ) => threadIdMap.get( id ) )
			.filter(
				( thread ) =>
					thread !== undefined && thread.status !== 'approved'
			);

		return {
			resultComments: updatedResult,
			unresolvedSortedThreads: unresolvedSortedComments,
		};
	}, [ threads, blocks ] );

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStylesContext();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

	if ( 0 < resultComments.length ) {
		const unsubscribe = subscribe( () => {
			const activeSidebar = getActiveComplementaryArea( 'core' );

			if ( ! activeSidebar ) {
				enableComplementaryArea( 'core', collabSidebarName );
				unsubscribe();
			}
		} );
	}

	const AddCommentComponent = blockCommentId
		? CommentAvatarIndicator
		: AddCommentButton;

	// Find the current thread for the selected block.
	const currentThread = blockCommentId
		? resultComments.find( ( thread ) => thread.id === blockCommentId )
		: null;

	// If postId is not a valid number, do not render the comment sidebar.
	if ( ! ( !! postId && typeof postId === 'number' ) ) {
		return null;
	}

	return (
		<>
			<AddCommentComponent
				onClick={ openCollabBoard }
				thread={ currentThread }
				hasMoreComments={ hasMoreComments }
			/>
			<PluginSidebar
				identifier={ collabHistorySidebarName }
				// translators: Comments sidebar title
				title={ __( 'Comments' ) }
				icon={ commentIcon }
			>
				<CollabSidebarContent
					comments={ resultComments }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
				/>
			</PluginSidebar>
			<PluginSidebar
				isPinnable={ false }
				header={ false }
				identifier={ collabSidebarName }
				className="editor-collab-sidebar"
				headerClassName="editor-collab-sidebar__header"
			>
				<CollabSidebarContent
					comments={ unresolvedSortedThreads }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					styles={ {
						backgroundColor,
					} }
				/>
			</PluginSidebar>
		</>
	);
}
