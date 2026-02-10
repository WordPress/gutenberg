/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { BlockBreadcrumb, BlockToolbar } from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { useState, useCallback } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import EditorNotices from '../editor-notices';
import Header from '../header';
import InserterSidebar from '../inserter-sidebar';
import ListViewSidebar from '../list-view-sidebar';
import { RevisionsHeader, RevisionsCanvas } from '../post-revisions-preview';
import SavePublishPanels from '../save-publish-panels';
import TextEditor from '../text-editor';
import VisualEditor from '../visual-editor';
import StylesCanvas from '../styles-canvas';
import { MediaPreview } from '../media';

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

export default function EditorInterface( {
	className,
	children,
	forceIsDirty,
	contentRef,
	disableIframe,
	autoFocus,
	customSaveButton,
	customSavePanel,
	forceDisableBlockTools,
	iframeProps,
} ) {
	const {
		mode,
		isAttachment,
		isInserterOpened,
		isListViewOpened,
		isDistractionFree,
		isPreviewMode,
		showBlockBreadcrumbs,
		postTypeLabel,
		stylesPath,
		showStylebook,
		isRevisionsMode,
	} = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const { getEditorSettings, getPostTypeLabel, getCurrentPostType } =
			select( editorStore );
		const {
			getStylesPath,
			getShowStylebook,
			isRevisionsMode: _isRevisionsMode,
		} = unlock( select( editorStore ) );
		const editorSettings = getEditorSettings();

		let _mode = select( editorStore ).getEditorMode();
		if ( ! editorSettings.richEditingEnabled && _mode === 'visual' ) {
			_mode = 'text';
		}
		if ( ! editorSettings.codeEditingEnabled && _mode === 'text' ) {
			_mode = 'visual';
		}

		return {
			mode: _mode,
			isInserterOpened: select( editorStore ).isInserterOpened(),
			isListViewOpened: select( editorStore ).isListViewOpened(),
			isDistractionFree: get( 'core', 'distractionFree' ),
			isPreviewMode: editorSettings.isPreviewMode,
			showBlockBreadcrumbs: get( 'core', 'showBlockBreadcrumbs' ),
			postTypeLabel: getPostTypeLabel(),
			stylesPath: getStylesPath(),
			showStylebook: getShowStylebook(),
			isAttachment:
				getCurrentPostType() === 'attachment' &&
				window?.__experimentalMediaEditor,
			isRevisionsMode: _isRevisionsMode(),
		};
	}, [] );
	const isLargeViewport = useViewportMatch( 'medium' );
	const secondarySidebarLabel = isListViewOpened
		? __( 'Document Overview' )
		: __( 'Block Library' );
	const shouldShowMediaEditor = !! isAttachment;
	const shouldShowStylesCanvas =
		! isAttachment &&
		( showStylebook || stylesPath?.startsWith( '/revisions' ) );
	const shouldShowBlockEditor =
		! shouldShowMediaEditor && ! shouldShowStylesCanvas;

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

	// Local state for diff toggle in revisions mode.
	const [ showDiff, setShowDiff ] = useState( true );

	// When in revisions mode, render the revisions interface.
	if ( isRevisionsMode ) {
		return (
			<InterfaceSkeleton
				className={ clsx( 'editor-editor-interface', className ) }
				labels={ interfaceLabels }
				header={
					<RevisionsHeader
						showDiff={ showDiff }
						onToggleDiff={ () => setShowDiff( ! showDiff ) }
					/>
				}
				content={ <RevisionsCanvas showDiff={ showDiff } /> }
				sidebar={ <ComplementaryArea.Slot scope="core" /> }
			/>
		);
	}

	return (
		<InterfaceSkeleton
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
			editorNotices={ <EditorNotices /> }
			secondarySidebar={
				! isAttachment &&
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
					{ ! isDistractionFree && ! isPreviewMode && (
						<EditorNotices />
					) }
					{ shouldShowMediaEditor && (
						<MediaPreview { ...iframeProps } />
					) }
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
									disableIframe={ disableIframe }
									// We should auto-focus the canvas (title) on load.
									// eslint-disable-next-line jsx-a11y/no-autofocus
									autoFocus={ autoFocus }
									iframeProps={ iframeProps }
								/>
							) }
							{ children }
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
