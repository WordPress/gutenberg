/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyComponentDecorators } from 'extensions';

/**
 * Internal dependencies
 */
import Header from '../header';
import Sidebar from '../sidebar';
import TextEditor from '../modes/text-editor';
import VisualEditor from '../modes/visual-editor';
import { getEditorMode, isEditorSidebarOpened } from '../selectors';

function Layout( { mode, isSidebarOpened } ) {
	const className = classnames( 'editor-layout', {
		'is-sidebar-opened': isSidebarOpened,
	} );

	return (
		<div className={ className }>
			<Header />
			<div className="editor-layout__content">
				{ mode === 'text' && <TextEditor /> }
				{ mode === 'visual' && <VisualEditor /> }
			</div>
			{ isSidebarOpened && <Sidebar /> }
		</div>
	);
}

export default flow(
	applyComponentDecorators,
	connect( ( state ) => ( {
		mode: getEditorMode( state ),
		isSidebarOpened: isEditorSidebarOpened( state ),
	} ) )
)( Layout );
