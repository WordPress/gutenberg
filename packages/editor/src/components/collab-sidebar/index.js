/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { useViewportMatch, useDebounce } from '@wordpress/compose';
import { comment as commentIcon } from '@wordpress/icons';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import PluginSidebar from '../plugin-sidebar';
import { collabHistorySidebarName, collabSidebarName } from './constants';
import { Comments } from './comments';
import { AddComment } from './add-comment';
import { store as editorStore } from '../../store';
import AddCommentMenuItem from './comment-menu-item';
import CommentAvatarIndicator from './comment-indicator-toolbar';
import { useGlobalStylesContext } from '../global-styles-provider';
import {
	useBlockComments,
	useBlockCommentsActions,
	useEnableFloatingSidebar,
} from './hooks';
import { focusCommentThread } from './utils';

/**
 * External dependencies
 */
import {
	useFloating,
	offset as offsetMiddleware,
	autoUpdate,
} from '@floating-ui/react-dom';
const { useBlockElementRef } = unlock( blockEditorPrivateApis );

function CollabSidebarContent( {
	showCommentBoard,
	setShowCommentBoard,
	styles,
	comments,
	commentSidebarRef,
	selectedThread,
	setSelectedThread,
} ) {
	const { onCreate, onEdit, onDelete } = useBlockCommentsActions();

	return (
		<div
			className="editor-collab-sidebar-panel"
			style={ styles }
			ref={ commentSidebarRef }
		>
			<VStack role="list" spacing="3">
				<AddComment
					onSubmit={ onCreate }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					commentSidebarRef={ commentSidebarRef }
				/>
				<Comments
					threads={ comments }
					onEditComment={ onEdit }
					onAddReply={ onCreate }
					onCommentDelete={ onDelete }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					commentSidebarRef={ commentSidebarRef }
					selectedThread={ selectedThread }
					setSelectedThread={ setSelectedThread }
					commentUpdated={ () => {} }
				/>
			</VStack>
		</div>
	);
}

function FloatingCommentBoard( {
	thread,
	showCommentBoard,
	setShowCommentBoard,
	commentSidebarRef,
	calculatedOffset,
	updateHeight,
	setBlockRef,
	selectedThread,
	setSelectedThread,
} ) {
	const [ commentLastUpdated, setCommentLastUpdated ] = useState( null );

	const blockRef = useRef();
	useBlockElementRef( thread.blockClientId, blockRef );

	// Use floating-ui to track the block element's position with the calculated offset.
	const { y, refs } = useFloating( {
		placement: 'right-start',
		middleware: [
			offsetMiddleware( {
				crossAxis: calculatedOffset || -16,
			} ),
		],
		whileElementsMounted: autoUpdate,
	} );

	// Store the block reference for each thread.
	useEffect( () => {
		if ( blockRef.current ) {
			refs.setReference( blockRef.current );
		}
	}, [ blockRef, refs ] );

	// Track thread heights.
	useEffect( () => {
		if ( refs.floating?.current ) {
			setBlockRef( thread.id, blockRef.current );
		}
	}, [ thread.id, refs.floating, setBlockRef ] );

	const commentUpdatedDebounced = () => {
		setCommentLastUpdated( Date.now() );
	};

	const commentUpdated = useDebounce( commentUpdatedDebounced, 150 );

	// When the selected thread changes, update heights, triggering offset recalculation.
	useEffect( () => {
		if ( refs.floating?.current ) {
			const newHeight = refs.floating.current.scrollHeight;
			updateHeight( thread.id, newHeight );
		}
	}, [
		thread.id,
		updateHeight,
		refs.floating,
		selectedThread,
		commentLastUpdated,
	] );

	const { onCreate, onEdit, onDelete } = useBlockCommentsActions();

	return (
		<VStack
			ref={ refs.setFloating }
			className="editor-collab-sidebar-panel__thread is-floating"
			spacing="0"
			style={ { top: y } }
		>
			<Comments
				threads={ [ thread ] }
				onEditComment={ onEdit }
				onAddReply={ onCreate }
				onCommentDelete={ onDelete }
				showCommentBoard={ showCommentBoard }
				setShowCommentBoard={ setShowCommentBoard }
				commentSidebarRef={ commentSidebarRef }
				selectedThread={ selectedThread }
				setSelectedThread={ setSelectedThread }
				commentUpdated={ commentUpdated }
			/>
		</VStack>
	);
}

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	const [ showCommentBoard, setShowCommentBoard ] = useState( false );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const isLargeViewport = useViewportMatch( 'medium' );
	const [ heights, setHeights ] = useState( {} );
	const [ boardOffsets, setBoardOffsets ] = useState( {} );
	const [ blockRefs, setBlockRefs ] = useState( {} );
	const [ selectedThread, setSelectedThread ] = useState( null );

	const updateHeight = useCallback( ( id, newHeight ) => {
		setHeights( ( prev ) => {
			if ( prev[ id ] !== newHeight ) {
				return { ...prev, [ id ]: newHeight };
			}
			return prev;
		} );
	}, [] );

	const commentSidebarRef = useRef( null );

	const { postId } = useSelect( ( select ) => {
		const { getCurrentPostId } = select( editorStore );
		return {
			postId: getCurrentPostId(),
		};
	}, [] );

	const blockCommentId = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId } =
			select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		return clientId
			? getBlockAttributes( clientId )?.metadata?.commentId
			: null;
	}, [] );

	const { resultComments, unresolvedSortedThreads, totalPages } =
		useBlockComments( postId );
	useEnableFloatingSidebar( resultComments.length > 0 );

	const hasMoreComments = totalPages && totalPages > 1;

	const setBlockRef = useCallback( ( id, blockRef ) => {
		setBlockRefs( ( prev ) => ( { ...prev, [ id ]: blockRef } ) );
	}, [] );

	// Recalculate offsets whenever the heights change.
	useEffect( () => {
		/**
		 * Calculate the y offsets for all comment threads. Account for potentially
		 * overlapping threads and adjust their positions accordingly.
		 */
		const calculateAllOffsets = () => {
			const offsets = {};
			let previousThreadData = null;

			// Co thru the comment threads from top to bottom.
			unresolvedSortedThreads.forEach( ( thread ) => {
				if ( ! blockRefs[ thread.id ] ) {
					return;
				}
				// The thread's starting top position is determined by its
				// associated block's position.
				const blockElement = blockRefs[ thread.id ];
				const blockRect = blockElement?.getBoundingClientRect();
				const threadTop = blockRect?.top || 0;

				// Heights are tracked by the comment threads themselves.
				const threadHeight = heights[ thread.id ] || 0;

				// By default, remove the top margin by shifting the block up
				// so it more precisely aligns with the block.
				let additionalOffset = -16;

				// The first block never needs to be adjusted.
				if ( previousThreadData ) {
					// Check if the thread overlaps with the previous one.
					const previousBottom =
						previousThreadData.threadTop +
						previousThreadData.threadHeight;
					if ( threadTop < previousBottom ) {
						// Shift down by the difference plus a margin to avoid overlap.
						additionalOffset = previousBottom - threadTop + 20;
					}
				}

				// Store the current thread's position and height for the next iteration.
				previousThreadData = {
					threadTop: threadTop + additionalOffset,
					threadHeight,
				};

				offsets[ thread.id ] = additionalOffset;
			} );

			return offsets;
		};
		const newOffsets = calculateAllOffsets();
		setBoardOffsets( newOffsets );
	}, [ heights ] );

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStylesContext();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

	// Find the current thread for the selected block.
	const currentThread = blockCommentId
		? resultComments.find( ( thread ) => thread.id === blockCommentId )
		: null;

	// If postId is not a valid number, do not render the comment sidebar.
	if ( ! ( !! postId && typeof postId === 'number' ) ) {
		return null;
	}

	async function openTheSidebar() {
		enableComplementaryArea( 'core', collabHistorySidebarName );
		const activeArea = await getActiveComplementaryArea( 'core' );

		// Move focus to the target element after the sidebar has opened.
		if (
			[ collabHistorySidebarName, collabSidebarName ].includes(
				activeArea
			)
		) {
			setShowCommentBoard( ! blockCommentId );
			focusCommentThread(
				blockCommentId,
				commentSidebarRef.current,
				// Focus a comment thread when there's a selected block with a comment.
				! blockCommentId ? 'textarea' : undefined
			);
		}
	}

	return (
		<>
			{ blockCommentId && (
				<CommentAvatarIndicator
					thread={ currentThread }
					hasMoreComments={ hasMoreComments }
					onClick={ openTheSidebar }
				/>
			) }
			<AddCommentMenuItem onClick={ openTheSidebar } />
			<PluginSidebar
				identifier={ collabHistorySidebarName }
				// translators: Comments sidebar title
				title={ __( 'Comments' ) }
				icon={ commentIcon }
				closeLabel={ __( 'Close Comments' ) }
			>
				<CollabSidebarContent
					comments={ resultComments }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					commentSidebarRef={ commentSidebarRef }
				/>
			</PluginSidebar>
			{ isLargeViewport && unresolvedSortedThreads.length > 0 && (
				<PluginSidebar
					isPinnable={ false }
					header={ false }
					identifier={ collabSidebarName }
					className="editor-collab-sidebar"
					headerClassName="editor-collab-sidebar__header"
					backgroundColor={ backgroundColor }
				>
					<div
						className="editor-collab-sidebar-panel"
						style={ {
							backgroundColor,
						} }
						ref={ commentSidebarRef }
					>
						{ unresolvedSortedThreads.length > 0 &&
							unresolvedSortedThreads.map( ( thread ) => {
								return (
									<FloatingCommentBoard
										key={ thread.id }
										thread={ thread }
										showCommentBoard={ showCommentBoard }
										setShowCommentBoard={
											setShowCommentBoard
										}
										calculatedOffset={
											boardOffsets[ thread.id ]
										}
										updateHeight={ updateHeight }
										commentSidebarRef={ commentSidebarRef }
										setBlockRef={ setBlockRef }
										selectedThread={ selectedThread }
										setSelectedThread={ setSelectedThread }
									/>
								);
							} ) }
					</div>
				</PluginSidebar>
			) }
		</>
	);
}
