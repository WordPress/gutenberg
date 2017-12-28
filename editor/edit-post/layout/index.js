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

/**
 * Internal dependencies
 */
import './style.scss';
import Header from '../header';
import Sidebar from '../sidebar';
import TextEditor from '../modes/text-editor';
import VisualEditor from '../modes/visual-editor';
import DocumentTitle from '../document-title';
import EditorModeKeyboardShortcuts from '../modes/keyboard-shortcuts';
import {
	MetaBoxes,
	AutosaveMonitor,
	UnsavedChangesWarning,
	EditorNotices,
	PostPublishPanel,
} from '../../components';
import {
	getEditorMode,
	hasOpenSidebar,
	isSidebarOpened,
	isFeatureActive,
} from '../../store/selectors';
import { toggleSidebar } from '../../store/actions';

function Layout( {
	mode,
	layoutHasOpenSidebar,
	isDefaultSidebarOpened,
	isPublishSidebarOpened,
	hasFixedToolbar,
	onToggleSidebar,
} ) {
	const className = classnames( 'editor-layout', {
		'is-sidebar-opened': layoutHasOpenSidebar,
		'has-fixed-toolbar': hasFixedToolbar,
	} );
	const closePublishPanel = () => onToggleSidebar( 'publish', false );

	return (
		<div className={ className }>
			<DocumentTitle />
			<UnsavedChangesWarning />
			<AutosaveMonitor />
			<Header />
			<div className="editor-layout__content" role="region" aria-label={ __( 'Editor content' ) } tabIndex="-1">
				<EditorNotices />
				<div className="editor-layout__editor">
					<EditorModeKeyboardShortcuts />
					{ mode === 'text' && <TextEditor /> }
					{ mode === 'visual' && <VisualEditor /> }
				</div>
				<div className="editor-layout__metaboxes">
					<MetaBoxes location="normal" />
				</div>
				<div className="editor-layout__metaboxes">
					<MetaBoxes location="advanced" />
				</div>
			</div>
			{ isDefaultSidebarOpened && <Sidebar /> }
			{ isPublishSidebarOpened && <PostPublishPanel onClose={ closePublishPanel } /> }
			<Popover.Slot />
		</div>
	);
}

export default connect(
	( state ) => ( {
		mode: getEditorMode( state ),
		layoutHasOpenSidebar: hasOpenSidebar( state ),
		isDefaultSidebarOpened: isSidebarOpened( state ),
		isPublishSidebarOpened: isSidebarOpened( state, 'publish' ),
		hasFixedToolbar: isFeatureActive( state, 'fixedToolbar' ),
	} ),
	{ onToggleSidebar: toggleSidebar }
)( navigateRegions( Layout ) );
