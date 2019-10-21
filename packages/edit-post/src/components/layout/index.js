/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalPageTemplatePicker } from '@wordpress/block-editor';
import {
	Button,
	Popover,
	ScrollLock,
	FocusReturnProvider,
	navigateRegions,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	AutosaveMonitor,
	LocalAutosaveMonitor,
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
	mode,
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
	showPageTemplatePicker,
} ) {
	const sidebarIsOpened = editorSidebarOpened || pluginSidebarOpened || publishSidebarOpened;

	const className = classnames( 'edit-post-layout', {
		'is-sidebar-opened': sidebarIsOpened,
		'has-fixed-toolbar': hasFixedToolbar,
		'has-metaboxes': hasActiveMetaboxes,
	} );

	const publishLandmarkProps = {
		role: 'region',
		/* translators: accessibility text for the publish landmark region. */
		'aria-label': __( 'Editor publish' ),
		tabIndex: -1,
	};

	const templates = [
		{ name: 'About', content: '<!-- wp:paragraph {"align":"left"} --><p class="has-text-align-left">Visitors will want to know who is on the other side of the page. Use this space to write about yourself, your site, your business, or anything you want. Use the testimonials below to quote others, talking about the same thing – in their own words.</p><!-- /wp:paragraph -->' },
		{ name: 'Contact', content: '<!-- wp:paragraph {"align":"left"} --><p class="has-text-align-left">Let\'s talk 👋 Don\'t hesitate to reach out with the contact information below, or send a message using the form.</p><!-- /wp:paragraph -->' },
	];

	return (
		<FocusReturnProvider className={ className }>
			<FullscreenMode />
			<BrowserURL />
			<UnsavedChangesWarning />
			<AutosaveMonitor />
			<LocalAutosaveMonitor />
			<Header />
			<div
				className="edit-post-layout__content"
				role="region"
				/* translators: accessibility text for the content landmark region. */
				aria-label={ __( 'Editor content' ) }
				tabIndex="-1"
			>
				<EditorNotices />
				<EditorModeKeyboardShortcuts />
				<KeyboardShortcutHelpModal />
				<ManageBlocksModal />
				<OptionsModal />
				{ ( mode === 'text' || ! isRichEditingEnabled ) && <TextEditor /> }
				{ isRichEditingEnabled && mode === 'visual' && <VisualEditor /> }
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
			{ showPageTemplatePicker && <__experimentalPageTemplatePicker templates={ templates } /> }
		</FocusReturnProvider>
	);
}

export default compose(
	withSelect( ( select ) => {
		const {
			getEditorMode,
			isEditorSidebarOpened,
			isPluginSidebarOpened,
			isPublishSidebarOpened,
			isFeatureActive,
			hasMetaBoxes,
			isSavingMetaBoxes,
		} = select( 'core/edit-post' );

		const {
			getCurrentPostType,
			getEditorSettings,
		} = select( 'core/editor' );

		const {
			getBlockCount,
			getSettings,
		} = select( 'core/block-editor' );

		const isPageTemplatesEnabled = getSettings().__experimentalEnablePageTemplates;
		const isEmpty = getBlockCount() === 0;
		const isPage = getCurrentPostType() === 'page';

		return {
			mode: getEditorMode(),
			editorSidebarOpened: isEditorSidebarOpened(),
			pluginSidebarOpened: isPluginSidebarOpened(),
			publishSidebarOpened: isPublishSidebarOpened(),
			hasFixedToolbar: isFeatureActive( 'fixedToolbar' ),
			hasActiveMetaboxes: hasMetaBoxes(),
			isSaving: isSavingMetaBoxes,
			isRichEditingEnabled: getEditorSettings().richEditingEnabled,
			showPageTemplatePicker: isPageTemplatesEnabled && isEmpty && isPage,
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
