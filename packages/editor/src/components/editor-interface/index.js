/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { InterfaceSkeleton, ComplementaryArea } from '@wordpress/interface';
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	store as blockEditorStore,
	BlockBreadcrumb,
	BlockToolbar,
} from '@wordpress/block-editor';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { useViewportMatch } from '@wordpress/compose';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import EditorNotices from '../editor-notices';
import Header from '../header';
import InserterSidebar from '../inserter-sidebar';
import ListViewSidebar from '../list-view-sidebar';
import SavePublishPanels from '../save-publish-panels';
import TextEditor from '../text-editor';
import VisualEditor from '../visual-editor';
import EditorContentSlotFill from './content-slot-fill';

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
	enableRegionNavigation,
	styles,
	children,
	forceIsDirty,
	contentRef,
	disableIframe,
	autoFocus,
	customSaveButton,
	customSavePanel,
	forceDisableBlockTools,
	title,
	iframeProps,
} ) {
	const {
		mode,
		isRichEditingEnabled,
		isInserterOpened,
		isListViewOpened,
		isDistractionFree,
		isPreviewMode,
		previousShortcut,
		nextShortcut,
		showBlockBreadcrumbs,
		documentLabel,
		blockEditorMode,
	} = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const { getEditorSettings, getPostTypeLabel } = select( editorStore );
		const editorSettings = getEditorSettings();
		const postTypeLabel = getPostTypeLabel();

		return {
			mode: select( editorStore ).getEditorMode(),
			isRichEditingEnabled: editorSettings.richEditingEnabled,
			isInserterOpened: select( editorStore ).isInserterOpened(),
			isListViewOpened: select( editorStore ).isListViewOpened(),
			isDistractionFree: get( 'core', 'distractionFree' ),
			isPreviewMode: editorSettings.__unstableIsPreviewMode,
			previousShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/editor/previous-region' ),
			nextShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/editor/next-region' ),
			showBlockBreadcrumbs: get( 'core', 'showBlockBreadcrumbs' ),
			// translators: Default label for the Document in the Block Breadcrumb.
			documentLabel: postTypeLabel || _x( 'Document', 'noun' ),
			blockEditorMode:
				select( blockEditorStore ).__unstableGetEditorMode(),
		};
	}, [] );
	const isLargeViewport = useViewportMatch( 'medium' );
	const secondarySidebarLabel = isListViewOpened
		? __( 'Document Overview' )
		: __( 'Block Library' );

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

	return (
		<InterfaceSkeleton
			enableRegionNavigation={ enableRegionNavigation }
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
						title={ title }
						isEditorIframed={ ! disableIframe }
					/>
				)
			}
			editorNotices={ <EditorNotices /> }
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
					{ ! isDistractionFree && ! isPreviewMode && (
						<EditorNotices />
					) }

					<EditorContentSlotFill.Slot>
						{ ( [ editorCanvasView ] ) =>
							editorCanvasView ? (
								editorCanvasView
							) : (
								<>
									{ ! isPreviewMode &&
										( mode === 'text' ||
											! isRichEditingEnabled ) && (
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
									{ ( isPreviewMode ||
										( isRichEditingEnabled &&
											mode === 'visual' ) ) && (
										<VisualEditor
											styles={ styles }
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
							)
						}
					</EditorContentSlotFill.Slot>
				</>
			}
			footer={
				! isPreviewMode &&
				! isDistractionFree &&
				isLargeViewport &&
				showBlockBreadcrumbs &&
				isRichEditingEnabled &&
				blockEditorMode !== 'zoom-out' &&
				mode === 'visual' && (
					<BlockBreadcrumb rootLabelText={ documentLabel } />
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
			shortcuts={ {
				previous: previousShortcut,
				next: nextShortcut,
			} }
		/>
	);
}
