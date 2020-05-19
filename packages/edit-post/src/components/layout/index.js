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
import OptionsModal from '../options-modal';
import BrowserURL from '../browser-url';
import Header from '../header';
import SettingsSidebar from '../sidebar/settings-sidebar';
import MetaBoxes from '../meta-boxes';
import WelcomeGuide from '../welcome-guide';
import ActionsPanel from './actions-panel';

const interfaceLabels = {
	leftSidebar: __( 'Block Library' ),
};

function Layout( { isRevision } ) {
	const [ isInserterOpen, setIsInserterOpen ] = useState( false );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isHugeViewport = useViewportMatch( 'huge', '>=' );
	const { openGeneralSidebar, closeGeneralSidebar } = useDispatch(
		'core/edit-post'
	);
	const {
		mode,
		isFullscreenActive,
		isRichEditingEnabled,
		editorSidebarOpened,
		pluginSidebarOpened,
		publishSidebarOpened,
		hasActiveMetaboxes,
		hasFixedToolbar,
		previousShortcut,
		nextShortcut,
		hasBlockSelected,
	} = useSelect( ( select ) => {
		return {
			hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive(
				'fixedToolbar'
			),
			editorSidebarOpened: select(
				'core/edit-post'
			).isEditorSidebarOpened(),
			pluginSidebarOpened: select(
				'core/edit-post'
			).isPluginSidebarOpened(),
			publishSidebarOpened: select(
				'core/edit-post'
			).isPublishSidebarOpened(),
			isFullscreenActive: select( 'core/edit-post' ).isFeatureActive(
				'fullscreenMode'
			),
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
		};
	}, [] );
	const sidebarIsOpened =
		editorSidebarOpened || pluginSidebarOpened || publishSidebarOpened;
	const className = classnames( 'edit-post-layout', 'is-mode-' + mode, {
		'is-sidebar-opened': sidebarIsOpened,
		'has-fixed-toolbar': hasFixedToolbar,
		'has-metaboxes': hasActiveMetaboxes,
	} );
	const openSidebarPanel = () =>
		openGeneralSidebar(
			hasBlockSelected ? 'edit-post/block' : 'edit-post/document'
		);

	// Inserter and Sidebars are mutually exclusive
	useEffect( () => {
		if ( sidebarIsOpened && ! isHugeViewport ) {
			setIsInserterOpen( false );
		}
	}, [ sidebarIsOpened, isHugeViewport ] );
	useEffect( () => {
		if ( isInserterOpen && ! isHugeViewport ) {
			closeGeneralSidebar();
		}
	}, [ isInserterOpen, isHugeViewport ] );

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
			<BrowserURL isRevision={ isRevision } />
			<UnsavedChangesWarning />
			<AutosaveMonitor />
			<LocalAutosaveMonitor />
			<EditPostKeyboardShortcuts />
			<EditorKeyboardShortcutsRegister />
			<FocusReturnProvider>
				<InterfaceSkeleton
					className={ className }
					labels={ interfaceLabels }
					header={
						<Header
							isInserterOpen={ isInserterOpen }
							onToggleInserter={ () =>
								setIsInserterOpen( ! isInserterOpen )
							}
							setEntitiesSavedStatesCallback={
								setEntitiesSavedStatesCallback
							}
						/>
					}
					leftSidebar={
						mode === 'visual' &&
						isInserterOpen && (
							<div className="edit-post-layout__inserter-panel">
								<div className="edit-post-layout__inserter-panel-header">
									<Button
										icon={ close }
										onClick={ () =>
											setIsInserterOpen( false )
										}
									/>
								</div>
								<div className="edit-post-layout__inserter-panel-content">
									<Library
										showInserterHelpPanel
										onSelect={ () => {
											if ( isMobileViewport ) {
												setIsInserterOpen( false );
											}
										} }
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
												: __(
														'Open document settings'
												  ) }
										</Button>
									</div>
								) }
								<SettingsSidebar />
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
				<OptionsModal />
				<KeyboardShortcutHelpModal />
				<WelcomeGuide />
				<Popover.Slot />
				<PluginArea />
			</FocusReturnProvider>
		</>
	);
}

export default Layout;
