/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import Header from 'header';
import Sidebar from 'sidebar';
import TextEditor from 'modes/text-editor';
import VisualEditor from 'modes/visual-editor';

function Layout( { mode, isSidebarOpened } ) {
	const className = classnames( 'editor-layout', {
		'is-sidebar-opened': isSidebarOpened
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

export default connect( ( state ) => ( {
	mode: state.mode,
	isSidebarOpened: state.isSidebarOpened
} ) )( Layout );
