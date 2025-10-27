/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useState, useRef, useEffect } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { comment as commentIcon } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import {
	collabHistorySidebarName,
	collabSidebarName,
	SIDEBARS,
} from './constants';
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
import PostTypeSupportCheck from '../post-type-support-check';

function NotesSidebarContent( {
	showCommentBoard,
	setShowCommentBoard,
	styles,
	comments,
	commentSidebarRef,
	reflowComments,
	commentLastUpdated,
	isFloating = false,
} ) {
	const { onCreate, onEdit, onDelete } =
		useBlockCommentsActions( reflowComments );

	return (
		<VStack
			className="editor-collab-sidebar-panel"
			style={ styles }
			role="list"
			spacing="3"
			justify="flex-start"
			ref={ ( node ) => {
				// Sometimes previous sidebar unmounts after the new one mounts.
				// This ensures we always have the latest reference.
				if ( node ) {
					commentSidebarRef.current = node;
				}
			} }
		>
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
				reflowComments={ reflowComments }
				commentLastUpdated={ commentLastUpdated }
				isFloating={ isFloating }
			/>
		</VStack>
	);
}

function NotesSidebar( { postId, mode } ) {
	const [ showCommentBoard, setShowCommentBoard ] = useState( false );
	const [ isInitialLoad, setIsInitialLoad ] = useState( true );
	const [ cachedComments, setCachedComments ] = useState( [] );
	const [ cachedUnresolvedThreads, setCachedUnresolvedThreads ] = useState(
		[]
	);
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const isLargeViewport = useViewportMatch( 'medium' );
	const commentSidebarRef = useRef( null );

	const showFloatingSidebar = isLargeViewport && mode === 'post-only';

	const blockCommentId = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientId } =
			select( blockEditorStore );
		const clientId = getSelectedBlockClientId();
		return clientId
			? getBlockAttributes( clientId )?.metadata?.noteId
			: null;
	}, [] );

	const {
		resultComments,
		unresolvedSortedThreads,
		totalPages,
		reflowComments,
		commentLastUpdated,
		hasResolved,
		isResolving,
	} = useBlockComments( postId, isInitialLoad );

	// Cache comments between initial load (parent comments only) and full load (all comments).
	useEffect( () => {
		if ( resultComments.length > 0 ) {
			setCachedComments( resultComments );
			reflowComments();
		}
		if ( unresolvedSortedThreads.length > 0 ) {
			setCachedUnresolvedThreads( unresolvedSortedThreads );
			reflowComments();
		}
	}, [ reflowComments, resultComments, unresolvedSortedThreads ] );

	useEnableFloatingSidebar(
		showFloatingSidebar &&
			( cachedUnresolvedThreads.length > 0 || showCommentBoard )
	);

	// Transition from initial load (parent comments only) to full load (all comments with replies)
	// once the parent comments query has completed and rendered.
	useEffect( () => {
		if ( isInitialLoad && hasResolved && ! isResolving ) {
			// Use a timeout to ensure the browser has painted the parent comments.
			const timeoutId = setTimeout( () => {
				setIsInitialLoad( false );
				reflowComments();
			}, 1000 );
			return () => clearTimeout( timeoutId );
		}
	}, [ isInitialLoad, hasResolved, isResolving, reflowComments ] );

	const hasMoreComments = totalPages && totalPages > 1;

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStylesContext();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

	// Find the current thread for the selected block.
	const currentThread = blockCommentId
		? cachedComments.find( ( thread ) => thread.id === blockCommentId )
		: null;

	async function openTheSidebar() {
		const prevArea = await getActiveComplementaryArea( 'core' );
		const activeNotesArea = SIDEBARS.find( ( name ) => name === prevArea );

		// If the notes sidebar is not already active, enable the floating sidebar.
		if ( ! activeNotesArea ) {
			enableComplementaryArea(
				'core',
				showFloatingSidebar
					? collabSidebarName
					: collabHistorySidebarName
			);
		}

		const currentArea = await getActiveComplementaryArea( 'core' );
		// Bail out if the current active area is not one of note sidebars.
		if ( ! SIDEBARS.includes( currentArea ) ) {
			return;
		}

		setShowCommentBoard( ! blockCommentId );
		focusCommentThread(
			blockCommentId,
			commentSidebarRef.current,
			// Focus a comment thread when there's a selected block with a comment.
			! blockCommentId ? 'textarea' : undefined
		);
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
				name={ collabHistorySidebarName }
				title={ __( 'Notes' ) }
				icon={ commentIcon }
				closeLabel={ __( 'Close Notes' ) }
			>
				<NotesSidebarContent
					comments={ cachedComments }
					showCommentBoard={ showCommentBoard }
					setShowCommentBoard={ setShowCommentBoard }
					commentSidebarRef={ commentSidebarRef }
					reflowComments={ reflowComments }
					commentLastUpdated={ commentLastUpdated }
				/>
			</PluginSidebar>
			{ showFloatingSidebar && (
				<PluginSidebar
					isPinnable={ false }
					header={ false }
					identifier={ collabSidebarName }
					className="editor-collab-sidebar"
					headerClassName="editor-collab-sidebar__header"
					backgroundColor={ backgroundColor }
				>
					<NotesSidebarContent
						comments={ cachedUnresolvedThreads }
						showCommentBoard={ showCommentBoard }
						setShowCommentBoard={ setShowCommentBoard }
						commentSidebarRef={ commentSidebarRef }
						reflowComments={ reflowComments }
						commentLastUpdated={ commentLastUpdated }
						styles={ {
							backgroundColor,
						} }
						isFloating
					/>
				</PluginSidebar>
			) }
		</>
	);
}

export default function NotesSidebarContainer() {
	const { postId, mode } = useSelect( ( select ) => {
		const { getCurrentPostId, getRenderingMode } = select( editorStore );
		return {
			postId: getCurrentPostId(),
			mode: getRenderingMode(),
		};
	}, [] );

	if ( ! postId || typeof postId !== 'number' ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			<NotesSidebar postId={ postId } mode={ mode } />
		</PostTypeSupportCheck>
	);
}
