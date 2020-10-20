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
import {
	Button,
	ScrollLock,
	Popover,
	FocusReturnProvider,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { PluginArea } from '@wordpress/plugins';
import { __ } from '@wordpress/i18n';
import {
	ComplementaryArea,
	FullscreenMode,
	InterfaceSkeleton,
} from '@wordpress/interface';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { close } from '@wordpress/icons';

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
import PopoverWrapper from './popover-wrapper';

const interfaceLabels = {
	leftSidebar: __( 'Block library' ),
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

function Layout() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isHugeViewport = useViewportMatch( 'huge', '>=' );
	const {
		openGeneralSidebar,
		closeGeneralSidebar,
		setIsInserterOpened,
	} = useDispatch( 'core/edit-post' );
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
		showIconLabels,
		hasReducedUI,
	} = useSelect( ( select ) => {
		return {
			hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive(
				'fixedToolbar'
			),
			sidebarIsOpened: !! (
				select( 'core/interface' ).getActiveComplementaryArea(
					'core/edit-post'
				) || select( 'core/edit-post' ).isPublishSidebarOpened()
			),
			isFullscreenActive: select( 'core/edit-post' ).isFeatureActive(
				'fullscreenMode'
			),
			showMostUsedBlocks: select( 'core/edit-post' ).isFeatureActive(
				'mostUsedBlocks'
			),
			isInserterOpened: select( 'core/edit-post' ).isInserterOpened(),
			mode: select( 'core/edit-post' ).getEditorMode(),
			isRichEditingEnabled: select( 'core/editor' ).getEditorSettings()
				.richEditingEnabled,
			hasActiveMetaboxes: select( 'core/edit-post' ).hasMetaBoxes(),
			previousShortcut: select(
				'core/keyboard-shortcuts'
			).getAllShortcutRawKeyCombinations(
				'core/edit-post/previous-region'
			),
			nextShortcut: select(
				'core/keyboard-shortcuts'
			).getAllShortcutRawKeyCombinations( 'core/edit-post/next-region' ),
			showIconLabels: select( 'core/edit-post' ).isFeatureActive(
				'showIconLabels'
			),
			hasReducedUI: select( 'core/edit-post' ).isFeatureActive(
				'reducedUI'
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
	// Note 'thruthy' callback implies an open panel.
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
			<FocusReturnProvider>
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
					leftSidebar={
						mode === 'visual' &&
						isInserterOpened && (
							<PopoverWrapper
								className="edit-post-layout__inserter-panel-popover-wrapper"
								onClose={ () => setIsInserterOpened( false ) }
							>
								<div className="edit-post-layout__inserter-panel">
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
											showMostUsedBlocks={
												showMostUsedBlocks
											}
											showInserterHelpPanel
											onSelect={ () => {
												if ( isMobileViewport ) {
													setIsInserterOpened(
														false
													);
												}
											} }
										/>
									</div>
								</div>
							</PopoverWrapper>
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
												: __(
														'Open document settings'
												  ) }
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
								<VisualEditor />
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
							closeEntitiesSavedStates={
								closeEntitiesSavedStates
							}
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
			</FocusReturnProvider>
		</>
	);
}

export default Layout;
