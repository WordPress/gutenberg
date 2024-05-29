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
import EditorSnackbars from '../editor-snackbars';
import Header from '../header';
import InserterSidebar from '../inserter-sidebar';
import ListViewSidebar from '../list-view-sidebar';
import SavePublishPanels from '../save-publish-panels';
import TextEditor from '../text-editor';
import VisualEditor from '../visual-editor';

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

export default function EditorCanvas( {
	className,
	styles,
	children,
	forceIsDirty,
	contentRef,
	disableIframe,
	autoFocus,
} ) {
	const {
		mode,
		isRichEditingEnabled,
		isInserterOpened,
		isListViewOpened,
		isDistractionFree,
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
	const isWideViewport = useViewportMatch( 'large' );
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
			isDistractionFree={ isDistractionFree && isWideViewport }
			className={ clsx( className, {
				'is-entity-save-view-open': !! entitiesSavedStatesCallback,
			} ) }
			labels={ {
				...interfaceLabels,
				secondarySidebar: secondarySidebarLabel,
			} }
			header={
				<Header
					forceIsDirty={ forceIsDirty }
					setEntitiesSavedStatesCallback={
						setEntitiesSavedStatesCallback
					}
				/>
			}
			editorNotices={ <EditorNotices /> }
			secondarySidebar={
				mode === 'visual' &&
				( ( isInserterOpened && <InserterSidebar /> ) ||
					( isListViewOpened && <ListViewSidebar /> ) )
			}
			sidebar={
				! isDistractionFree && <ComplementaryArea.Slot scope="core" />
			}
			notices={ <EditorSnackbars /> }
			content={
				<>
					{ ! isDistractionFree && <EditorNotices /> }
					{ ( mode === 'text' || ! isRichEditingEnabled ) && (
						<TextEditor
							// We should auto-focus the canvas (title) on load.
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus={ autoFocus }
						/>
					) }
					{ ! isLargeViewport && mode === 'visual' && (
						<BlockToolbar hideDragHandle />
					) }
					{ isRichEditingEnabled && mode === 'visual' && (
						<VisualEditor
							styles={ styles }
							contentRef={ contentRef }
							disableIframe={ disableIframe }
							// We should auto-focus the canvas (title) on load.
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus={ autoFocus }
						/>
					) }
					{ children }
				</>
			}
			footer={
				! isDistractionFree &&
				isLargeViewport &&
				showBlockBreadcrumbs &&
				isRichEditingEnabled &&
				blockEditorMode !== 'zoom-out' &&
				mode === 'visual' && (
					<div className="edit-post-layout__footer">
						<BlockBreadcrumb rootLabelText={ documentLabel } />
					</div>
				)
			}
			actions={
				<SavePublishPanels
					closeEntitiesSavedStates={ closeEntitiesSavedStates }
					isEntitiesSavedStatesOpen={ entitiesSavedStatesCallback }
					setEntitiesSavedStatesCallback={
						setEntitiesSavedStatesCallback
					}
					forceIsDirtyPublishPanel={ forceIsDirty }
				/>
			}
			shortcuts={ {
				previous: previousShortcut,
				next: nextShortcut,
			} }
		/>
	);
}
