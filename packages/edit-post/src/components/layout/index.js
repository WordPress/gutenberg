/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AutosaveMonitor,
	LocalAutosaveMonitor,
	UnsavedChangesWarning,
	EditorNotices,
	EditorKeyboardShortcutsRegister,
} from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockBreadcrumb,
	__experimentalLibrary as Library,
} from '@wordpress/block-editor';
import { Button, ScrollLock, Popover } from '@wordpress/components';
import {
	useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { PluginArea } from '@wordpress/plugins';
import { __ } from '@wordpress/i18n';
import {
	ComplementaryArea,
	FullscreenMode,
	InterfaceSkeleton,
	store as interfaceStore,
} from '@wordpress/interface';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { close } from '@wordpress/icons';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import TextEditor from '../text-editor';
import VisualEditor from '../visual-editor';
import EditPostKeyboardShortcuts from '../keyboard-shortcuts';
import KeyboardShortcutHelpModal from '../keyboard-shortcut-help-modal';
import ManageBlocksModal from '../manage-blocks-modal';
import PreferencesModal from '../preferences-modal';
import BrowserURL from '../browser-url';
import Header from '../header';
import SettingsSidebar from '../sidebar/settings-sidebar';
import MetaBoxes from '../meta-boxes';
import WelcomeGuide from '../welcome-guide';
import ActionsPanel from './actions-panel';
import { store as editPostStore } from '../../store';

const interfaceLabels = {
	secondarySidebar: __( 'Block library' ),
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

function Layout( { styles } ) {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isHugeViewport = useViewportMatch( 'huge', '>=' );
	const {
		openGeneralSidebar,
		closeGeneralSidebar,
		setIsInserterOpened,
	} = useDispatch( editPostStore );
	const {
		mode,
		isFullscreenActive,
		isRichEditingEnabled,
		sidebarIsOpened,
		hasActiveMetaboxes,
		hasFixedToolbar,
		previousShortcut,
		nextShortcut,
		hasBlockSelected,
		showMostUsedBlocks,
		isInserterOpened,
		insertionPoint,
		showIconLabels,
		hasReducedUI,
		showBlockBreadcrumbs,
	} = useSelect( ( select ) => {
		const editorSettings = select( 'core/editor' ).getEditorSettings();
		return {
			hasFixedToolbar: select( editPostStore ).isFeatureActive(
				'fixedToolbar'
			),
			sidebarIsOpened: !! (
				select( interfaceStore ).getActiveComplementaryArea(
					editPostStore.name
				) || select( editPostStore ).isPublishSidebarOpened()
			),
			isFullscreenActive: select( editPostStore ).isFeatureActive(
				'fullscreenMode'
			),
			showMostUsedBlocks: select( editPostStore ).isFeatureActive(
				'mostUsedBlocks'
			),
			isInserterOpened: select( editPostStore ).isInserterOpened(),
			insertionPoint: select(
				editPostStore
			).__experimentalGetInsertionPoint(),
			mode: select( editPostStore ).getEditorMode(),
			isRichEditingEnabled: editorSettings.richEditingEnabled,
			hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
			previousShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutRawKeyCombinations(
				'core/edit-post/previous-region'
			),
			nextShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutRawKeyCombinations( 'core/edit-post/next-region' ),
			showIconLabels: select( editPostStore ).isFeatureActive(
				'showIconLabels'
			),
			hasReducedUI: select( editPostStore ).isFeatureActive(
				'reducedUI'
			),
			showBlockBreadcrumbs: select( editPostStore ).isFeatureActive(
				'showBlockBreadcrumbs'
			),
		};
	}, [] );
	const className = classnames( 'edit-post-layout', 'is-mode-' + mode, {
		'is-sidebar-opened': sidebarIsOpened,
		'has-fixed-toolbar': hasFixedToolbar,
		'has-metaboxes': hasActiveMetaboxes,
		'show-icon-labels': showIconLabels,
	} );
	const openSidebarPanel = () =>
		openGeneralSidebar(
			hasBlockSelected ? 'edit-post/block' : 'edit-post/document'
		);

	// Inserter and Sidebars are mutually exclusive
	useEffect( () => {
		if ( sidebarIsOpened && ! isHugeViewport ) {
			setIsInserterOpened( false );
		}
	}, [ sidebarIsOpened, isHugeViewport ] );
	useEffect( () => {
		if ( isInserterOpened && ! isHugeViewport ) {
			closeGeneralSidebar();
		}
	}, [ isInserterOpened, isHugeViewport ] );

	// Local state for save panel.
	// Note 'truthy' callback implies an open panel.
	const [
		entitiesSavedStatesCallback,
		setEntitiesSavedStatesCallback,
	] = useState( false );
	const closeEntitiesSavedStates = useCallback(
		( arg ) => {
			if ( typeof entitiesSavedStatesCallback === 'function' ) {
				entitiesSavedStatesCallback( arg );
			}
			setEntitiesSavedStatesCallback( false );
		},
		[ entitiesSavedStatesCallback ]
	);
	const [ inserterDialogRef, inserterDialogProps ] = useDialog( {
		onClose: () => setIsInserterOpened( false ),
	} );

	return (
		<>
			<FullscreenMode isActive={ isFullscreenActive } />
			<BrowserURL />
			<UnsavedChangesWarning />
			<AutosaveMonitor />
			<LocalAutosaveMonitor />
			<EditPostKeyboardShortcuts />
			<EditorKeyboardShortcutsRegister />
			<SettingsSidebar />
			<InterfaceSkeleton
				className={ className }
				labels={ interfaceLabels }
				header={
					<Header
						setEntitiesSavedStatesCallback={
							setEntitiesSavedStatesCallback
						}
					/>
				}
				secondarySidebar={
					mode === 'visual' &&
					isInserterOpened && (
						<div
							ref={ inserterDialogRef }
							{ ...inserterDialogProps }
							className="edit-post-layout__inserter-panel"
						>
							<div className="edit-post-layout__inserter-panel-header">
								<Button
									icon={ close }
									onClick={ () =>
										setIsInserterOpened( false )
									}
								/>
							</div>
							<div className="edit-post-layout__inserter-panel-content">
								<Library
									showMostUsedBlocks={ showMostUsedBlocks }
									showInserterHelpPanel
									shouldFocusBlock={ isMobileViewport }
									rootClientId={ insertionPoint.rootClientId }
									__experimentalInsertionIndex={
										insertionPoint.insertionIndex
									}
								/>
							</div>
						</div>
					)
				}
				sidebar={
					( ! isMobileViewport || sidebarIsOpened ) && (
						<>
							{ ! isMobileViewport && ! sidebarIsOpened && (
								<div className="edit-post-layout__toogle-sidebar-panel">
									<Button
										isSecondary
										className="edit-post-layout__toogle-sidebar-panel-button"
										onClick={ openSidebarPanel }
										aria-expanded={ false }
									>
										{ hasBlockSelected
											? __( 'Open block settings' )
											: __( 'Open document settings' ) }
									</Button>
								</div>
							) }
							<ComplementaryArea.Slot scope="core/edit-post" />
						</>
					)
				}
				content={
					<>
						<EditorNotices />
						{ ( mode === 'text' || ! isRichEditingEnabled ) && (
							<TextEditor />
						) }
						{ isRichEditingEnabled && mode === 'visual' && (
							<VisualEditor styles={ styles } />
						) }
						<div className="edit-post-layout__metaboxes">
							<MetaBoxes location="normal" />
							<MetaBoxes location="advanced" />
						</div>
						{ isMobileViewport && sidebarIsOpened && (
							<ScrollLock />
						) }
					</>
				}
				footer={
					! hasReducedUI &&
					showBlockBreadcrumbs &&
					! isMobileViewport &&
					isRichEditingEnabled &&
					mode === 'visual' && (
						<div className="edit-post-layout__footer">
							<BlockBreadcrumb />
						</div>
					)
				}
				actions={
					<ActionsPanel
						closeEntitiesSavedStates={ closeEntitiesSavedStates }
						isEntitiesSavedStatesOpen={
							entitiesSavedStatesCallback
						}
						setEntitiesSavedStatesCallback={
							setEntitiesSavedStatesCallback
						}
					/>
				}
				shortcuts={ {
					previous: previousShortcut,
					next: nextShortcut,
				} }
			/>
			<ManageBlocksModal />
			<PreferencesModal />
			<KeyboardShortcutHelpModal />
			<WelcomeGuide />
			<Popover.Slot />
			<PluginArea />
		</>
	);
}

export default Layout;
