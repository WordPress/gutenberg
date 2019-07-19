/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	Popover,
	ScrollLock,
	FocusReturnProvider,
	navigateRegions,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { PreserveScrollInReorder } from '@wordpress/block-editor';
import {
	AutosaveMonitor,
	UnsavedChangesWarning,
	EditorNotices,
	PostPublishPanel,
} from '@wordpress/editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { PluginArea } from '@wordpress/plugins';
import { withViewportMatch } from '@wordpress/viewport';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BrowserURL from '../browser-url';
import Header from '../header';
import TextEditor from '../text-editor';
import VisualEditor from '../visual-editor';
import EditorModeKeyboardShortcuts from '../keyboard-shortcuts';
import KeyboardShortcutHelpModal from '../keyboard-shortcut-help-modal';
import ManageBlocksModal from '../manage-blocks-modal';
import OptionsModal from '../options-modal';
import MetaBoxes from '../meta-boxes';
import SettingsSidebar from '../sidebar/settings-sidebar';
import Sidebar from '../sidebar';
import PluginPostPublishPanel from '../sidebar/plugin-post-publish-panel';
import PluginPrePublishPanel from '../sidebar/plugin-pre-publish-panel';
import FullscreenMode from '../fullscreen-mode';

function Layout( {
	contentEditingMode,
	editorSidebarOpened,
	pluginSidebarOpened,
	publishSidebarOpened,
	hasFixedToolbar,
	closePublishSidebar,
	togglePublishSidebar,
	hasActiveMetaboxes,
	isSaving,
	isMobileViewport,
	isRichEditingEnabled,
} ) {
	const sidebarIsOpened = editorSidebarOpened || pluginSidebarOpened || publishSidebarOpened;

	const className = classnames( 'edit-post-layout', {
		'is-sidebar-opened': sidebarIsOpened,
		'has-fixed-toolbar': hasFixedToolbar,
	} );

	const publishLandmarkProps = {
		role: 'region',
		/* translators: accessibility text for the publish landmark region. */
		'aria-label': __( 'Editor publish' ),
		tabIndex: -1,
	};
	return (
		<FocusReturnProvider className={ className }>
			<FullscreenMode />
			<BrowserURL />
			<UnsavedChangesWarning />
			<AutosaveMonitor />
			<Header />
			<div
				className="edit-post-layout__content"
				role="region"
				/* translators: accessibility text for the content landmark region. */
				aria-label={ __( 'Editor content' ) }
				tabIndex="-1"
			>
				<EditorNotices />
				<PreserveScrollInReorder />
				<EditorModeKeyboardShortcuts />
				<KeyboardShortcutHelpModal />
				<ManageBlocksModal />
				<OptionsModal />
				{ ( contentEditingMode === 'text' || ! isRichEditingEnabled ) && <TextEditor /> }
				{ isRichEditingEnabled && contentEditingMode === 'visual' && (
					<VisualEditor />
				) }
				<div className="edit-post-layout__metaboxes">
					<MetaBoxes location="normal" />
				</div>
				<div className="edit-post-layout__metaboxes">
					<MetaBoxes location="advanced" />
				</div>
			</div>
			{ publishSidebarOpened ? (
				<PostPublishPanel
					{ ...publishLandmarkProps }
					onClose={ closePublishSidebar }
					forceIsDirty={ hasActiveMetaboxes }
					forceIsSaving={ isSaving }
					PrePublishExtension={ PluginPrePublishPanel.Slot }
					PostPublishExtension={ PluginPostPublishPanel.Slot }
				/>
			) : (
				<>
					<div className="edit-post-toggle-publish-panel" { ...publishLandmarkProps }>
						<Button
							isDefault
							type="button"
							className="edit-post-toggle-publish-panel__button"
							onClick={ togglePublishSidebar }
							aria-expanded={ false }
						>
							{ __( 'Open publish panel' ) }
						</Button>
					</div>
					<SettingsSidebar />
					<Sidebar.Slot />
					{
						isMobileViewport && sidebarIsOpened && <ScrollLock />
					}
				</>
			) }
			<Popover.Slot />
			<PluginArea />
		</FocusReturnProvider>
	);
}

export default compose(
	withSelect( ( select ) => {
		const { getEditorSettings, getViewEditingMode } = select( 'core/editor' );
		const editorSettings = getEditorSettings();
		return {
			contentEditingMode: select( 'core/edit-post' ).getEditorMode(),
			editorSidebarOpened: select( 'core/edit-post' ).isEditorSidebarOpened(),
			pluginSidebarOpened: select( 'core/edit-post' ).isPluginSidebarOpened(),
			publishSidebarOpened: select( 'core/edit-post' ).isPublishSidebarOpened(),
			hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
			hasActiveMetaboxes: select( 'core/edit-post' ).hasMetaBoxes(),
			isSaving: select( 'core/edit-post' ).isSavingMetaBoxes(),
			isRichEditingEnabled: editorSettings.richEditingEnabled,
			viewEditingMode: getViewEditingMode(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { closePublishSidebar, togglePublishSidebar } = dispatch( 'core/edit-post' );
		return {
			closePublishSidebar,
			togglePublishSidebar,
		};
	} ),
	navigateRegions,
	withViewportMatch( { isMobileViewport: '< small' } ),
)( Layout );
