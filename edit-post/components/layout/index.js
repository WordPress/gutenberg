/**
 * External dependencies
 */
import classnames from 'classnames';
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { Popover, navigateRegions } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	AutosaveMonitor,
	UnsavedChangesWarning,
	EditorNotices,
	PostPublishPanel,
	DocumentTitle,
} from '@wordpress/editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import Header from '../header';
import Sidebar from '../sidebar';
import TextEditor from '../text-editor';
import VisualEditor from '../visual-editor';
import EditorModeKeyboardShortcuts from '../keyboard-shortcuts';
import MetaBoxes from '../meta-boxes';
import { getMetaBoxContainer } from '../../utils/meta-boxes';
import PluginsPanel from '../../components/plugins-panel/index.js';

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
} ) {
	const className = classnames( 'edit-post-layout', {
		'is-sidebar-opened': editorSidebarOpened || pluginSidebarOpened || publishSidebarOpened,
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
				<div className="edit-post-layout__editor">
					<EditorModeKeyboardShortcuts />
					{ mode === 'text' && <TextEditor /> }
					{ mode === 'visual' && <VisualEditor /> }
				</div>
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
			{ editorSidebarOpened && <Sidebar /> }
			{ pluginSidebarOpened && <PluginsPanel /> }
			<Popover.Slot />
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
	navigateRegions
)( Layout );
