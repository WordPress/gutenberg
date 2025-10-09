/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
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
	onPositionCalculated,
	setBlockRef,
} ) {
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

	useEffect( () => {
		if ( blockRef.current ) {
			refs.setReference( blockRef.current );
		}
	}, [ blockRef, refs, setBlockRef ] );

	// Track height changes.
	useEffect( () => {
		if ( refs.floating?.current ) {
			setBlockRef( thread.id, refs.floating.current );

			const observer = new ResizeObserver( ( entries ) => {
				for ( const entry of entries ) {
					const newHeight = entry.target.scrollHeight;
					updateHeight( thread.id, newHeight );
				}
			} );

			observer.observe( refs.floating.current );

			// Initial height
			const initialHeight = refs.floating.current.scrollHeight;
			updateHeight( thread.id, initialHeight );

			return () => observer.disconnect();
		}
	}, [ thread.id, updateHeight, refs.floating ] );

	// Report the calculated absolute position back to parent
	useEffect( () => {
		if ( y !== null && y !== 0 ) {
			onPositionCalculated( thread.id, y );
		}
	}, [ y, thread.id, onPositionCalculated ] );

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
			/>
		</VStack>
	);
}

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	const [ showCommentBoard, setShowCommentBoard ] = useState( false );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const isLargeViewport = useViewportMatch( 'medium' );

	const [ heights, setHeights ] = useState( {} );
	const [ boardOffsets, setBoardOffsets ] = useState( {} );
	const [ commentRefs, setCommentRefs ] = useState( {} );
	const absolutePositionsRef = useRef( {} );

	const updateHeight = useCallback( ( id, newHeight ) => {
		setHeights( ( prev ) => {
			if ( prev[ id ] !== newHeight ) {
				return { ...prev, [ id ]: newHeight };
			}
			return prev;
		} );
	}, [] );

	const onPositionCalculated = useCallback( ( id, absoluteY ) => {
		absolutePositionsRef.current[ id ] = absoluteY;
	}, [] );

	const { selectBlock } = useDispatch( blockEditorStore );
	const handleThreadClick = ( thread ) => {
		if ( thread?.clientId ) {
			selectBlock( thread.clientId );
		}
	};

	const commentSidebarRef = useRef( null );

	const { postId } = useSelect( ( select ) => {
		const { getCurrentPostId } = select( editorStore );
		return {
			postId: getCurrentPostId(),
		};
	}, [] );

	const { blockCommentId } = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId } =
			select( blockEditorStore );
		const _clientId = getSelectedBlockClientId();

		return {
			blockCommentId: _clientId
				? getBlockAttributes( _clientId )?.metadata?.commentId
				: null,
		};
	}, [] );

	const openCollabBoard = () => {
		setShowCommentBoard( true );
		enableComplementaryArea( 'core', collabHistorySidebarName );
	};

	const { resultComments, unresolvedSortedThreads, totalPages } =
		useBlockComments( postId );
	useEnableFloatingSidebar( resultComments.length > 0 );

	const hasMoreComments = totalPages && totalPages > 1;

	const setBlockRef = useCallback( ( id, ref ) => {
		commentRefs[ id ] = ref;
		setCommentRefs( commentRefs );
	}, [] );


	// Centralized offset calculator that calculates crossAxis offsets
	// to prevent overlaps when boards change height or new boards are added.
	const calculateAllOffsets = useCallback( () => {
		const offsets = {};
		let previousThreadData = null;

		unresolvedSortedThreads.forEach( ( thread ) => {

			const blockElement = commentRefs[ thread.id ];
			const blockRect = blockElement?.getBoundingClientRect();
			const blockTop = blockRect?.top || 0;
			const boardHeight = blockRect?.height || 0;

			// Default offset (remove padding so first comment aligns with block)
			let crossAxisOffset = -16;

			// Check if we need additional offset to avoid overlap with previous board
			if ( previousThreadData ) {
				const previousBlockTop = previousThreadData.blockTop;
				const previousOffset = previousThreadData.offset;
				const previousHeight = previousThreadData.height;

				// Calculate where the previous board's bottom would be
				const previousBoardBottom =
					previousHeight + previousBlockTop;

				// Calculate where this board would naturally appear
				const currentBoardTop = blockTop - 16;

				// Check if there's overlap.
				if ( currentBoardTop < previousBoardBottom + 20 ) {
					// Need to shift down to avoid overlap
					const additionalOffset =
						previousBoardBottom + 20 - blockTop;
					crossAxisOffset = additionalOffset;
				}
			}

			offsets[ thread.id ] = crossAxisOffset;

			// Store data for next iteration
			previousThreadData = {
				blockTop,
				offset: crossAxisOffset,
				height: boardHeight,
			};
		} );

		return offsets;
	}, [ unresolvedSortedThreads ] );

	// Recalculate offsets whenever heights change, threads change, or comment board state changes
	useEffect( () => {
		const newOffsets = calculateAllOffsets();
		setBoardOffsets( newOffsets );
	}, [ calculateAllOffsets, showCommentBoard, heights, blockCommentId ] );

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

	return (
		<>
			{ blockCommentId && (
				<CommentAvatarIndicator
					thread={ currentThread }
					hasMoreComments={ hasMoreComments }
				/>
			) }
			<AddCommentMenuItem onClick={ openCollabBoard } />
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
			{ isLargeViewport && (
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
										onPositionCalculated={
											onPositionCalculated
										}
										onClick={ () =>
											handleThreadClick( thread )
										}
										commentSidebarRef={ commentSidebarRef }
										setBlockRef={ setBlockRef }
									/>
								);
							} ) }
					</div>
				</PluginSidebar>
			) }
		</>
	);
}
