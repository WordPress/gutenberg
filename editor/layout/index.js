/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Header from 'header';
import TextEditor from 'text-editor';
import VisualEditor from 'visual-editor';

function Layout( { mode } ) {
	return (
		<div>
			<Header />
			{ mode === 'text' && <TextEditor /> }
			{ mode === 'visual' && <VisualEditor /> }
		</div>
	);
}

export default connect( ( state ) => ( {
	mode: state.mode
} ) )( Layout );
