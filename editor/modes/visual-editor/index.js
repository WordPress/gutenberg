/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import './style.scss';
import InserterButton from '../../inserter/button';
import VisualEditorBlock from './block';

const VisualEditor = ( { blocks, onBlur } ) => {
	let _ref = null; // closure for dom element ref

	return (
		<div className="editor-visual-editor" onBlur={ ( e ) => onBlur( e, _ref ) } ref={ ( el ) => _ref = el } >
			{ blocks.map( ( uid ) => (
				<VisualEditorBlock key={ uid } uid={ uid } />
				) ) }
			<InserterButton />
		</div>
	);
};

const mapStateToProps = ( state ) => ( {
	blocks: state.blocks.order
} );

const mapDispatchToProps = 	( dispatch ) => ( {
	onBlur( { relatedTarget }, containerEl ) {
		// if the VisualEditor gets a blur event, and if the new focus is not inside
		// the VisualEditor, then the editor has lost focus
		// - on Blur, relatedTarget = event target receiving focus.
		if ( ! relatedTarget || ( containerEl && ! containerEl.contains( relatedTarget ) ) ) {
			dispatch( {
				type: 'FOCUS_LOST'
			} );
		}
	} } );

export default connect( mapStateToProps, mapDispatchToProps )( VisualEditor );
