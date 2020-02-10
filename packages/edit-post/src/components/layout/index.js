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
	PostPublishPanel,
	EditorKeyboardShortcutsRegister,
} from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockBreadcrumb,
	__experimentalEditorSkeleton as EditorSkeleton,
	__experimentalPageTemplatePicker,
	__experimentalUsePageTemplatePickerVisible,
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

/**
 * Internal dependencies
 */
import TextEditor from '../text-editor';
import VisualEditor from '../visual-editor';
import EditPostKeyboardShortcuts from '../keyboard-shortcuts';
import KeyboardShortcutHelpModal from '../keyboard-shortcut-help-modal';
import ManageBlocksModal from '../manage-blocks-modal';
import OptionsModal from '../options-modal';
import FullscreenMode from '../fullscreen-mode';
import BrowserURL from '../browser-url';
import Header from '../header';
import SettingsSidebar from '../sidebar/settings-sidebar';
import Sidebar from '../sidebar';
import MetaBoxes from '../meta-boxes';
import PluginPostPublishPanel from '../sidebar/plugin-post-publish-panel';
import PluginPrePublishPanel from '../sidebar/plugin-pre-publish-panel';
import WelcomeGuide from '../welcome-guide';

function Layout() {
	const isMobileViewport = useViewportMatch( 'small', '<' );
	const {
		closePublishSidebar,
		openGeneralSidebar,
		togglePublishSidebar,
	} = useDispatch( 'core/edit-post' );
	const {
		mode,
		isRichEditingEnabled,
		editorSidebarOpened,
		pluginSidebarOpened,
		publishSidebarOpened,
		hasActiveMetaboxes,
		isSaving,
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
			mode: select( 'core/edit-post' ).getEditorMode(),
			isRichEditingEnabled: select( 'core/editor' ).getEditorSettings()
				.richEditingEnabled,
			hasActiveMetaboxes: select( 'core/edit-post' ).hasMetaBoxes(),
			isSaving: select( 'core/edit-post' ).isSavingMetaBoxes(),
			previousShortcut: select(
				'core/keyboard-shortcuts'
			).getAllShortcutRawKeyCombinations(
				'core/edit-post/previous-region'
			),
			nextShortcut: select(
				'core/keyboard-shortcuts'
			).getAllShortcutRawKeyCombinations( 'core/edit-post/next-region' ),
			hasBlockSelected: select(
				'core/block-editor'
			).getBlockSelectionStart(),
		};
	}, [] );
	const showPageTemplatePicker = __experimentalUsePageTemplatePickerVisible();
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

	return (
		<>
			<FullscreenMode />
			<BrowserURL />
			<UnsavedChangesWarning />
			<AutosaveMonitor />
			<LocalAutosaveMonitor />
			<EditPostKeyboardShortcuts />
			<EditorKeyboardShortcutsRegister />
			<FocusReturnProvider>
				<EditorSkeleton
					className={ className }
					header={ <Header /> }
					sidebar={
						<>
							{ ! sidebarIsOpened && (
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
							<SettingsSidebar />
							<Sidebar.Slot />
						</>
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
						isRichEditingEnabled &&
						mode === 'visual' && (
							<div className="edit-post-layout__footer">
								<BlockBreadcrumb />
							</div>
						)
					}
					publish={
						publishSidebarOpened ? (
							<PostPublishPanel
								onClose={ closePublishSidebar }
								forceIsDirty={ hasActiveMetaboxes }
								forceIsSaving={ isSaving }
								PrePublishExtension={
									PluginPrePublishPanel.Slot
								}
								PostPublishExtension={
									PluginPostPublishPanel.Slot
								}
							/>
						) : (
							<div className="edit-post-layout__toogle-publish-panel">
								<Button
									isSecondary
									className="edit-post-layout__toogle-publish-panel-button"
									onClick={ togglePublishSidebar }
									aria-expanded={ false }
								>
									{ __( 'Open publish panel' ) }
								</Button>
							</div>
						)
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
				{ showPageTemplatePicker && (
					<__experimentalPageTemplatePicker />
				) }
			</FocusReturnProvider>
		</>
	);
}

export default Layout;
