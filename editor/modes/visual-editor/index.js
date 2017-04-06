/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import InserterButton from '../../inserter/button';
import VisualEditorBlock from './block';

class VisualEditor extends wp.element.Component {
	blurWithDomEl( e, onBlur ) {
		return onBlur( e, this._domElement );
	}

	render() {
		const { blocks, onBlur } = this.props;

		return (
			<div className="editor-visual-editor" onBlur={ ( e ) => this.blurWithDomEl( e, onBlur ) } ref={ ( el ) => this._domElement = el } >
				{ blocks.map( ( uid ) => (
					<VisualEditorBlock key={ uid } uid={ uid } />
				) ) }
				<InserterButton />
			</div>
		);
	}
}

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
