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
	hasFixedToolbar,
	hasOpenSidebar,
	isSidebarOpened,
} from '../../store/selectors';
import { toggleSidebar } from '../../store/actions';

function Layout( {
	mode,
	layoutHasOpenSidebar,
	isDefaultSidebarOpened,
	isPublishSidebarOpened,
	fixedToolbarActive,
	onClosePublishPanel,
} ) {
	const className = classnames( 'edit-post-layout', {
		'is-sidebar-opened': layoutHasOpenSidebar,
		'has-fixed-toolbar': fixedToolbarActive,
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
			{ isDefaultSidebarOpened && <Sidebar /> }
			{ isPublishSidebarOpened && <PostPublishPanel onClose={ onClosePublishPanel } /> }
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
		fixedToolbarActive: hasFixedToolbar( state ),
	} ),
	{
		onClosePublishPanel: () => toggleSidebar( 'publish', false ),
	},
	undefined,
	{ storeKey: 'edit-post' }
)( navigateRegions( Layout ) );
