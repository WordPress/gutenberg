/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Popover, navigateRegions } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	MetaBoxes,
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
import TextEditor from '../modes/text-editor';
import VisualEditor from '../modes/visual-editor';
import EditorModeKeyboardShortcuts from '../modes/keyboard-shortcuts';
import {
	getEditorMode,
	hasOpenSidebar,
	isFeatureActive,
	getOpenedGeneralSidebar,
	isPublishSidebarOpened,
} from '../../store/selectors';
import { closeGeneralSidebar, closePublishSidebar } from '../../store/actions';
import PluginsPanel from '../../components/plugins-panel/index.js';

function GeneralSidebar( { openedGeneralSidebar } ) {
	switch ( openedGeneralSidebar ) {
		case 'editor':
			return <Sidebar />;
		case 'plugins':
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
	onCloseGeneralSidebar,
	onClosePublishSidebar,
} ) {
	const className = classnames( 'edit-post-layout', {
		'is-sidebar-opened': layoutHasOpenSidebar,
		'has-fixed-toolbar': hasFixedToolbar,
	} );

	return (
		<div className={ className }>
			<DocumentTitle />
			<UnsavedChangesWarning />
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
					onCloseGeneralSidebar={ onCloseGeneralSidebar }
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
	} ),
	{
		onCloseGeneralSidebar: closeGeneralSidebar,
		onClosePublishSidebar: closePublishSidebar,
	},
	undefined,
	{ storeKey: 'edit-post' }
)( navigateRegions( Layout ) );
