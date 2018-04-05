/**
 * External dependencies
 */
import classnames from 'classnames';
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { Popover, ScrollLock, navigateRegions } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	AutosaveMonitor,
	UnsavedChangesWarning,
	EditorNotices,
	PostPublishPanel,
	DocumentTitle,
	PreserveScrollInReorder,
} from '@wordpress/editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/element';
import { PluginArea } from '@wordpress/plugins';
import { withViewportMatch } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockSidebar from '../sidebar/block-sidebar';
import DocumentSidebar from '../sidebar/document-sidebar';
import Header from '../header';
import TextEditor from '../text-editor';
import VisualEditor from '../visual-editor';
import EditorModeKeyboardShortcuts from '../keyboard-shortcuts';
import MetaBoxes from '../meta-boxes';
import { getMetaBoxContainer } from '../../utils/meta-boxes';
import PluginSidebar from '../plugin-sidebar';

function Layout( {
	mode,
	editorSidebarOpened,
	pluginSidebarOpened,
	publishSidebarOpened,
	hasFixedToolbar,
	closePublishSidebar,
	metaBoxes,
	hasActiveMetaboxes,
	isSaving,
	isMobileViewport,
} ) {
	const sidebarIsOpened = editorSidebarOpened || pluginSidebarOpened || publishSidebarOpened;

	const className = classnames( 'edit-post-layout', {
		'is-sidebar-opened': sidebarIsOpened,
		'has-fixed-toolbar': hasFixedToolbar,
	} );

	return (
		<div className={ className }>
			<DocumentTitle />
			<UnsavedChangesWarning forceIsDirty={ () => {
				return some( metaBoxes, ( metaBox, location ) => {
					return metaBox.isActive &&
						jQuery( getMetaBoxContainer( location ) ).serialize() !== metaBox.data;
				} );
			} } />
			<AutosaveMonitor />
			<Header />
			<div className="edit-post-layout__content" role="region" aria-label={ __( 'Editor content' ) } tabIndex="-1">
				<EditorNotices />
				<PreserveScrollInReorder />
				<EditorModeKeyboardShortcuts />
				{ mode === 'text' && <TextEditor /> }
				{ mode === 'visual' && <VisualEditor /> }
				<div className="edit-post-layout__metaboxes">
					<MetaBoxes location="normal" />
				</div>
				<div className="edit-post-layout__metaboxes">
					<MetaBoxes location="advanced" />
				</div>
			</div>
			{ publishSidebarOpened && (
				<PostPublishPanel
					onClose={ closePublishSidebar }
					forceIsDirty={ hasActiveMetaboxes }
					forceIsSaving={ isSaving }
				/>
			) }
			<DocumentSidebar />
			<BlockSidebar />
			<PluginSidebar.Slot />
			{
				isMobileViewport && sidebarIsOpened && <ScrollLock />
			}
			<Popover.Slot />
			<PluginArea />
		</div>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		mode: select( 'core/edit-post' ).getEditorMode(),
		editorSidebarOpened: select( 'core/edit-post' ).isEditorSidebarOpened(),
		pluginSidebarOpened: select( 'core/edit-post' ).isPluginSidebarOpened(),
		publishSidebarOpened: select( 'core/edit-post' ).isPublishSidebarOpened(),
		hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
		metaBoxes: select( 'core/edit-post' ).getMetaBoxes(),
		hasActiveMetaboxes: select( 'core/edit-post' ).hasMetaBoxes(),
		isSaving: select( 'core/edit-post' ).isSavingMetaBoxes(),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		closePublishSidebar: dispatch( 'core/edit-post' ).closePublishSidebar,
	} ) ),
	navigateRegions,
	withViewportMatch( { isMobileViewport: '< small' } ),
)( Layout );
