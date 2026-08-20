import clsx from 'clsx';
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	BlockBreadcrumb,
	BlockToolbar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { InlineNotices } from '@wordpress/notices';
import { ThemeProvider } from '@wordpress/theme';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { EDITOR_INTENT_SUGGEST } from '../../store/constants';
import TemplateValidationNotice from '../template-validation-notice';
import Header from '../header';
import InserterSidebar from '../inserter-sidebar';
import ListViewSidebar from '../list-view-sidebar';
import {
	RevisionsHeader,
	RevisionsCanvas,
	RevisionsCodeDiff,
} from '../post-revisions-preview';
import { CollaboratorsOverlay } from '../collaborators-overlay';
import { useCollaboratorNotifications } from '../collaborators-presence/use-collaborator-notifications';
import SavePublishPanels from '../save-publish-panels';
import TextEditor from '../text-editor';
import VisualEditor from '../visual-editor';
import StylesCanvas from '../styles-canvas';

const interfaceLabels = {
	/* translators: accessibility text for the editor top bar landmark region. */
	header: __( 'Editor top bar' ),
	/* translators: accessibility text for the editor content landmark region. */
	body: __( 'Editor content' ),
	/* translators: accessibility text for the editor settings landmark region. */
	sidebar: __( 'Editor settings' ),
	/* translators: accessibility text for the editor publish landmark region. */
	actions: __( 'Editor publish' ),
	/* translators: accessibility text for the editor footer landmark region. */
	footer: __( 'Editor footer' ),
};

function Notices() {
	const isValidTemplate = useSelect( ( select ) => {
		return select( blockEditorStore ).isValidTemplate();
	}, [] );

	return (
		<ThemeProvider cornerRadius="none">
			<InlineNotices
				className="editor-notices"
				pinnedNoticesClassName="editor-notices__pinned"
				dismissibleNoticesClassName="editor-notices__dismissible"
			>
				{ ! isValidTemplate && <TemplateValidationNotice /> }
			</InlineNotices>
		</ThemeProvider>
	);
}

export default function EditorInterface( {
	className,
	children,
	forceIsDirty,
	contentRef,
	autoFocus,
	customSaveButton,
	customSavePanel,
	forceDisableBlockTools,
	iframeProps,
} ) {
	const {
		mode,
		postId,
		postType,
		isInserterOpened,
		isListViewOpened,
		isDistractionFree,
		isPreviewMode,
		showBlockBreadcrumbs,
		postTypeLabel,
		stylesPath,
		showStylebook,
		isRevisionsMode,
		showDiff,
	} = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const {
			getEditorSettings,
			getPostTypeLabel,
			getCurrentPostType,
			getCurrentPostId,
		} = select( editorStore );
		const {
			getStylesPath,
			getShowStylebook,
			isRevisionsMode: _isRevisionsMode,
			isShowingRevisionDiff,
			getEditorIntent,
		} = unlock( select( editorStore ) );
		const editorSettings = getEditorSettings();

		let _mode = select( editorStore ).getEditorMode();
		/*
		 * `getEditorMode` already reports `visual` while suggesting, whatever
		 * the stored preference says, because the code editor has nowhere to
		 * render an inline suggestion marker. Re-deriving `text` from
		 * `richEditingEnabled` here would put that raw `post_content`
		 * textarea back on screen and undo the mask - the exact bypass it
		 * exists to close - while the header and the document tools, which
		 * read the selector directly, went on reporting `visual`. Entering
		 * the intent is refused outright when rich editing is off (see
		 * `setEditorIntent`); this holds the line if the setting is flipped
		 * mid-session.
		 */
		if (
			! editorSettings.richEditingEnabled &&
			_mode === 'visual' &&
			getEditorIntent() !== EDITOR_INTENT_SUGGEST
		) {
			_mode = 'text';
		}
		if ( ! editorSettings.codeEditingEnabled && _mode === 'text' ) {
			_mode = 'visual';
		}

		return {
			mode: _mode,
			postId: getCurrentPostId(),
			postType: getCurrentPostType(),
			isInserterOpened: select( editorStore ).isInserterOpened(),
			isListViewOpened: select( editorStore ).isListViewOpened(),
			isDistractionFree: get( 'core', 'distractionFree' ),
			isPreviewMode: editorSettings.isPreviewMode,
			showBlockBreadcrumbs: get( 'core', 'showBlockBreadcrumbs' ),
			postTypeLabel: getPostTypeLabel(),
			stylesPath: getStylesPath(),
			showStylebook: getShowStylebook(),
			isRevisionsMode: _isRevisionsMode(),
			showDiff: isShowingRevisionDiff(),
		};
	}, [] );
	const { setShowRevisionDiff } = unlock( useDispatch( editorStore ) );

	// Runs unconditionally so join/leave/save notifications are dispatched
	// regardless of viewport width or whether the header centre area is visible.
	useCollaboratorNotifications( postId, postType );

	/*
	 * Swapping the canvas unmounts whatever held focus, and on an
	 * already-loaded post the incoming visual editor does not claim it back,
	 * so focus falls to `<body>` and keyboard navigation restarts from the
	 * top of the page. The Suggest intent reaches that swap without any
	 * deliberate mode switch - `getEditorMode` masks the stored preference,
	 * so entering the intent from the code editor replaces the canvas on its
	 * own - which leaves the user nowhere with nothing announced.
	 *
	 * Put focus on the editor content region, the landmark the swapped-in
	 * canvas lives in. Only when focus was genuinely orphaned: any other
	 * active element means the swap came from somewhere still focused (a
	 * menu, the header) and taking focus away from it would be worse.
	 */
	const skeletonRef = useRef();
	const previousModeRef = useRef( mode );
	useEffect( () => {
		const previousMode = previousModeRef.current;
		previousModeRef.current = mode;
		if ( previousMode === mode ) {
			return;
		}
		const { activeElement, body } =
			skeletonRef.current?.ownerDocument ?? {};
		if ( activeElement && activeElement !== body ) {
			return;
		}
		skeletonRef.current
			?.querySelector( '.interface-interface-skeleton__content' )
			?.focus();
	}, [ mode ] );

	const isLargeViewport = useViewportMatch( 'medium' );
	const secondarySidebarLabel = isListViewOpened
		? __( 'Document Overview' )
		: __( 'Block Library' );
	const shouldShowStylesCanvas =
		showStylebook || stylesPath?.startsWith( '/revisions' );
	const shouldShowBlockEditor = ! shouldShowStylesCanvas;

	// Local state for save panel.
	// Note 'truthy' callback implies an open panel.
	const [ entitiesSavedStatesCallback, setEntitiesSavedStatesCallback ] =
		useState( false );
	const closeEntitiesSavedStates = useCallback(
		( arg ) => {
			if ( typeof entitiesSavedStatesCallback === 'function' ) {
				entitiesSavedStatesCallback( arg );
			}
			setEntitiesSavedStatesCallback( false );
		},
		[ entitiesSavedStatesCallback ]
	);

	// When in revisions mode, render the revisions interface.
	if ( isRevisionsMode ) {
		return (
			<InterfaceSkeleton
				className={ clsx( 'editor-editor-interface', className ) }
				labels={ interfaceLabels }
				header={
					<RevisionsHeader
						showDiff={ showDiff }
						onToggleDiff={ () => setShowRevisionDiff( ! showDiff ) }
					/>
				}
				content={
					mode === 'text' ? (
						<RevisionsCodeDiff />
					) : (
						<RevisionsCanvas />
					)
				}
				sidebar={ <ComplementaryArea.Slot scope="core" /> }
			/>
		);
	}

	return (
		<InterfaceSkeleton
			ref={ skeletonRef }
			isDistractionFree={ isDistractionFree }
			className={ clsx( 'editor-editor-interface', className, {
				'is-entity-save-view-open': !! entitiesSavedStatesCallback,
				'is-distraction-free': isDistractionFree && ! isPreviewMode,
			} ) }
			labels={ {
				...interfaceLabels,
				secondarySidebar: secondarySidebarLabel,
			} }
			header={
				! isPreviewMode && (
					<Header
						forceIsDirty={ forceIsDirty }
						setEntitiesSavedStatesCallback={
							setEntitiesSavedStatesCallback
						}
						customSaveButton={ customSaveButton }
						forceDisableBlockTools={ forceDisableBlockTools }
					/>
				)
			}
			editorNotices={ <Notices /> }
			secondarySidebar={
				! isPreviewMode &&
				mode === 'visual' &&
				( ( isInserterOpened && <InserterSidebar /> ) ||
					( isListViewOpened && <ListViewSidebar /> ) )
			}
			sidebar={
				! isPreviewMode &&
				! isDistractionFree && <ComplementaryArea.Slot scope="core" />
			}
			content={
				<>
					{ ! isDistractionFree && ! isPreviewMode && <Notices /> }
					{ shouldShowStylesCanvas && <StylesCanvas /> }
					{ shouldShowBlockEditor && (
						<>
							{ ! isPreviewMode && mode === 'text' && (
								<TextEditor
									// We should auto-focus the canvas (title) on load.
									// eslint-disable-next-line jsx-a11y/no-autofocus
									autoFocus={ autoFocus }
								/>
							) }
							{ ! isPreviewMode &&
								! isLargeViewport &&
								mode === 'visual' && (
									<BlockToolbar hideDragHandle />
								) }
							{ ( isPreviewMode || mode === 'visual' ) && (
								<VisualEditor
									contentRef={ contentRef }
									// We should auto-focus the canvas (title) on load.
									// eslint-disable-next-line jsx-a11y/no-autofocus
									autoFocus={ autoFocus }
									iframeProps={ iframeProps }
								/>
							) }
							{ children }
							<CollaboratorsOverlay
								postId={ postId }
								postType={ postType }
							/>
						</>
					) }
				</>
			}
			footer={
				! isPreviewMode &&
				! isDistractionFree &&
				isLargeViewport &&
				showBlockBreadcrumbs &&
				mode === 'visual' && (
					<BlockBreadcrumb
						rootLabelText={
							postTypeLabel
								? decodeEntities( postTypeLabel )
								: undefined
						}
					/>
				)
			}
			actions={
				! isPreviewMode
					? customSavePanel || (
							<SavePublishPanels
								closeEntitiesSavedStates={
									closeEntitiesSavedStates
								}
								isEntitiesSavedStatesOpen={
									entitiesSavedStatesCallback
								}
								setEntitiesSavedStatesCallback={
									setEntitiesSavedStatesCallback
								}
								forceIsDirtyPublishPanel={ forceIsDirty }
							/>
					  )
					: undefined
			}
		/>
	);
}
