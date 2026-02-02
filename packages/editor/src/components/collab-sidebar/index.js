/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	__experimentalVStack as VStack,
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
} from '@wordpress/components';
import { useState, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import { comment as commentIcon } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as interfaceStore, PinnedItems } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';

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
import { unlock } from '../../lock-unlock';

function NotesSidebarContent( {
	newNoteFormState,
	setNewNoteFormState,
	styles,
	comments,
	commentSidebarRef,
	reflowComments,
	commentLastUpdated,
	isFloating = false,
	isCompactNote = false,
} ) {
	const { onCreate, onEdit, onDelete } =
		useBlockCommentsActions( reflowComments );

	return (
		<VStack
			className="editor-collab-sidebar-panel"
			style={ styles }
			role="tree"
			spacing="3"
			justify="flex-start"
			ref={ ( node ) => {
				// Sometimes previous sidebar unmounts after the new one mounts.
				// This ensures we always have the latest reference.
				if ( node ) {
					commentSidebarRef.current = node;
				}
			} }
			aria-label={
				isFloating ? __( 'Unresolved notes' ) : __( 'All notes' )
			}
		>
			<Comments
				threads={ comments }
				onEditComment={ onEdit }
				onAddReply={ onCreate }
				onCommentDelete={ onDelete }
				newNoteFormState={ newNoteFormState }
				setNewNoteFormState={ setNewNoteFormState }
				commentSidebarRef={ commentSidebarRef }
				reflowComments={ reflowComments }
				commentLastUpdated={ commentLastUpdated }
				isFloating={ isFloating }
				isCompactNote={ isCompactNote }
			/>
		</VStack>
	);
}

function NotesSidebar( { postId } ) {
	// Enum: 'closed' | 'creating' | 'open'
	const [ newNoteFormState, setNewNoteFormState ] = useState( 'closed' );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );
	const { set: setPreference } = useDispatch( preferencesStore );
	const { toggleBlockSpotlight } = unlock( useDispatch( blockEditorStore ) );
	const isLargeViewport = useViewportMatch( 'medium' );
	const commentSidebarRef = useRef( null );

	const showFloatingSidebar = isLargeViewport;

	const { clientId, blockCommentId, isCompactNote, isAllNotesSidebarActive } =
		useSelect( ( select ) => {
			const { getBlockAttributes, getSelectedBlockClientId } =
				select( blockEditorStore );
			const _clientId = getSelectedBlockClientId();
			return {
				clientId: _clientId,
				blockCommentId: _clientId
					? getBlockAttributes( _clientId )?.metadata?.noteId
					: null,
				isCompactNote: !! select( preferencesStore ).get(
					'core',
					'compactNotes'
				),
				isAllNotesSidebarActive:
					select( interfaceStore ).getActiveComplementaryArea(
						'core'
					) === collabHistorySidebarName,
			};
		}, [] );

	const { isDistractionFree } = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		return {
			isDistractionFree: get( 'core', 'distractionFree' ),
		};
	}, [] );

	const {
		resultComments,
		unresolvedSortedThreads,
		reflowComments,
		commentLastUpdated,
	} = useBlockComments( postId );
	useEnableFloatingSidebar(
		showFloatingSidebar &&
			( unresolvedSortedThreads.length > 0 ||
				newNoteFormState !== 'closed' )
	);

	// Get the global styles to set the background color of the sidebar.
	const { merged: GlobalStyles } = useGlobalStylesContext();
	const backgroundColor = GlobalStyles?.styles?.color?.background;

	// Find the current thread for the selected block.
	const currentThread = blockCommentId
		? resultComments.find( ( thread ) => thread.id === blockCommentId )
		: null;
	const showAllNotesSidebar = resultComments.length > 0;

	async function openTheSidebar() {
		const prevArea = await getActiveComplementaryArea( 'core' );
		const activeNotesArea = SIDEBARS.find( ( name ) => name === prevArea );

		if ( currentThread?.status === 'approved' ) {
			enableComplementaryArea( 'core', collabHistorySidebarName );
		} else if ( ! activeNotesArea || ! showAllNotesSidebar ) {
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

		setNewNoteFormState( ! currentThread ? 'open' : 'closed' );
		focusCommentThread(
			currentThread?.id,
			commentSidebarRef.current,
			// Focus a comment thread when there's a selected block with a comment.
			! currentThread ? 'textarea' : undefined
		);
		toggleBlockSpotlight( clientId, true );
	}

	let notesDropdownValue = 'expand';
	if ( isAllNotesSidebarActive ) {
		notesDropdownValue = 'show-all';
	} else if ( isCompactNote ) {
		notesDropdownValue = 'minimize';
	}

	if ( isDistractionFree ) {
		return <AddCommentMenuItem isDistractionFree />;
	}

	return (
		<>
			{ !! currentThread && (
				<CommentAvatarIndicator
					thread={ currentThread }
					onClick={ openTheSidebar }
				/>
			) }
			<AddCommentMenuItem onClick={ openTheSidebar } />
			{ showAllNotesSidebar && (
				<PinnedItems scope="core">
					<DropdownMenu
						icon={ commentIcon }
						label={ __( 'Notes' ) }
						toggleProps={ {
							size: 'compact',
						} }
					>
						{ () => (
							<MenuGroup>
								<MenuItemsChoice
									choices={ [
										{
											value: 'show-all',
											label: __( 'Show all notes' ),
										},
										{
											value: 'minimize',
											label: __( 'Minimize notes' ),
										},
										{
											value: 'expand',
											label: __( 'Expand notes' ),
										},
									] }
									value={ notesDropdownValue }
									onSelect={ ( value ) => {
										if ( value === 'show-all' ) {
											enableComplementaryArea(
												'core',
												collabHistorySidebarName
											);
										} else {
											if ( isAllNotesSidebarActive ) {
												disableComplementaryArea(
													'core'
												);
											}
											setPreference(
												'core',
												'compactNotes',
												value === 'minimize'
											);
										}
									} }
								/>
							</MenuGroup>
						) }
					</DropdownMenu>
				</PinnedItems>
			) }
			{ showAllNotesSidebar && (
				<PluginSidebar
					isPinnable={ ! isLargeViewport }
					identifier={ collabHistorySidebarName }
					name={ collabHistorySidebarName }
					title={ __( 'All notes' ) }
					header={
						<h2 className="interface-complementary-area-header__title">
							{ __( 'All notes' ) }
						</h2>
					}
					icon={ commentIcon }
					closeLabel={ __( 'Close Notes' ) }
				>
					<NotesSidebarContent
						comments={ resultComments }
						newNoteFormState={ newNoteFormState }
						setNewNoteFormState={ setNewNoteFormState }
						commentSidebarRef={ commentSidebarRef }
					/>
				</PluginSidebar>
			) }
			{ isLargeViewport && (
				<PluginSidebar
					isPinnable={ false }
					header={ false }
					identifier={ collabSidebarName }
					className="editor-collab-sidebar"
					headerClassName="editor-collab-sidebar__header"
					backgroundColor={ backgroundColor }
				>
					<NotesSidebarContent
						comments={ unresolvedSortedThreads }
						newNoteFormState={ newNoteFormState }
						setNewNoteFormState={ setNewNoteFormState }
						commentSidebarRef={ commentSidebarRef }
						reflowComments={ reflowComments }
						commentLastUpdated={ commentLastUpdated }
						styles={ {
							backgroundColor,
						} }
						isFloating
						isCompactNote={ isCompactNote }
					/>
				</PluginSidebar>
			) }
		</>
	);
}

export default function NotesSidebarContainer() {
	const { postId, editorMode } = useSelect( ( select ) => {
		const { getCurrentPostId, getEditorMode } = select( editorStore );
		return {
			postId: getCurrentPostId(),
			editorMode: getEditorMode(),
		};
	}, [] );

	if ( ! postId || typeof postId !== 'number' ) {
		return null;
	}

	// Hide Notes sidebar in Code Editor mode since block-level commenting.
	if ( editorMode === 'text' ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			<NotesSidebar postId={ postId } />
		</PostTypeSupportCheck>
	);
}
