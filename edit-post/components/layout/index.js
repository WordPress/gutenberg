/**
 * External dependencies
 */
import { connect } from 'react-redux';
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
import {
	getEditorMode,
	hasOpenSidebar,
	isFeatureActive,
	getOpenedGeneralSidebar,
	isPublishSidebarOpened,
	getActivePlugin,
	getMetaBoxes,
} from '../../store/selectors';
import { closePublishSidebar } from '../../store/actions';
import PluginsPanel from '../../components/plugins-panel/index.js';
import { getSidebarSettings } from '../../api/sidebar';

function GeneralSidebar( { openedGeneralSidebar } ) {
	switch ( openedGeneralSidebar ) {
		case 'editor':
			return <Sidebar />;
		case 'plugin':
			return <PluginsPanel />;
		default:
	}
	return null;
}

function Layout( {
	mode,
	layoutHasOpenSidebar,
	publishSidebarOpen,
	openedGeneralSidebar,
	hasFixedToolbar,
	onClosePublishSidebar,
	plugin,
	metaBoxes,
} ) {
	const isSidebarOpened = layoutHasOpenSidebar &&
		( openedGeneralSidebar !== 'plugin' || getSidebarSettings( plugin ) );
	const className = classnames( 'edit-post-layout', {
		'is-sidebar-opened': isSidebarOpened,
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
			{ publishSidebarOpen && <PostPublishPanel onClose={ onClosePublishSidebar } /> }
			{
				openedGeneralSidebar !== null && <GeneralSidebar
					openedGeneralSidebar={ openedGeneralSidebar } />
			}
			<Popover.Slot />
		</div>
	);
}

export default connect(
	( state ) => ( {
		mode: getEditorMode( state ),
		layoutHasOpenSidebar: hasOpenSidebar( state ),
		openedGeneralSidebar: getOpenedGeneralSidebar( state ),
		publishSidebarOpen: isPublishSidebarOpened( state ),
		hasFixedToolbar: isFeatureActive( state, 'fixedToolbar' ),
		plugin: getActivePlugin( state ),
		metaBoxes: getMetaBoxes( state ),
	} ),
	{
		onClosePublishSidebar: closePublishSidebar,
	},
	undefined,
	{ storeKey: 'edit-post' }
)( navigateRegions( Layout ) );
