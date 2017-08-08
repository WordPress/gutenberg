/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { NoticeList } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import Header from '../header';
import Sidebar from '../sidebar';
import TextEditor from '../modes/text-editor';
import VisualEditor from '../modes/visual-editor';
import UnsavedChangesWarning from '../unsaved-changes-warning';
import DocumentTitle from '../document-title';
import AutosaveMonitor from '../autosave-monitor';
import { removeNotice } from '../actions';
import {
	getEditorMode,
	isEditorSidebarOpened,
	getNotices,
} from '../selectors';

function Layout( { mode, isSidebarOpened, notices, ...props } ) {
	const className = classnames( 'editor-layout', {
		'is-sidebar-opened': isSidebarOpened,
	} );

	return (
		<div className={ className }>
			<DocumentTitle />
			<NoticeList onRemove={ props.removeNotice } notices={ notices } />
			<UnsavedChangesWarning />
			<AutosaveMonitor />
			<Header />
			<div className="editor-layout__content">
				{ mode === 'text' && <TextEditor /> }
				{ mode === 'visual' && <VisualEditor /> }
			</div>
			{ isSidebarOpened && <Sidebar /> }
		</div>
	);
}

export default connect(
	( state ) => ( {
		mode: getEditorMode( state ),
		isSidebarOpened: isEditorSidebarOpened( state ),
		notices: getNotices( state ),
	} ),
	{ removeNotice }
)( Layout );
