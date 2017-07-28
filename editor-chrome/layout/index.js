/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { NoticeList } from 'components';
import { Provider as EditorProvider } from 'editor';

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
import { removeNotice, editPost } from '../actions';
import {
	getEditorMode,
	isEditorSidebarOpened,
	getNotices,
	getEditedPostContent,
} from '../selectors';

function Layout( { config, value, mode, isSidebarOpened, notices, ...props } ) {
	const className = classnames( 'editor-layout', {
		'is-sidebar-opened': isSidebarOpened,
	} );

	const onChangeContent = ( content ) => props.editPost( { content } );

	return (
		<EditorProvider config={ config } value={ value } onChange={ onChangeContent }>
			<div className={ className }>
				<DocumentTitle />
				<NoticeList onRemove={ props.removeNotice } notices={ notices } />
				<UnsavedChangesWarning />
				<Header />
				<div className="editor-layout__content">
					{ mode === 'text' && <TextEditor value={ value } onChange={ onChangeContent } /> }
					{ mode === 'visual' && <VisualEditor /> }
				</div>
				{ isSidebarOpened && <Sidebar /> }
			</div>
		</EditorProvider>
	);
}

export default connect(
	( state ) => ( {
		mode: getEditorMode( state ),
		isSidebarOpened: isEditorSidebarOpened( state ),
		notices: getNotices( state ),
		value: getEditedPostContent( state ),
	} ),
	{ removeNotice, editPost }
)( Layout );
