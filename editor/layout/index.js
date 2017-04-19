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

function Layout( { mode, sidebarOpened } ) {
	const className = classnames( 'editor-layout', {
		'sidebar-opened': sidebarOpened
	} );

	return (
		<div className={ className }>
			<Header />
			<div className="editor-layout__content">
				{ mode === 'text' && <TextEditor /> }
				{ mode === 'visual' && <VisualEditor /> }
			</div>
			{ sidebarOpened && <Sidebar /> }
		</div>
	);
}

export default connect( ( state ) => ( {
	mode: state.mode,
	sidebarOpened: state.sidebar.opened
} ) )( Layout );
