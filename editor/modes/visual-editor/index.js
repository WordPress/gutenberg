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
	blurWithDomEl( onBlur ) {
		return onBlur( this._domElement );
	}

	render() {
		const { blocks, onBlur } = this.props;

		return (
			<div className="editor-visual-editor" onBlur={ () => this.blurWithDomEl( onBlur ) } ref={ ( el ) => this._domElement = el } >
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
	onBlur( containerEl ) {
		// if the VisualEditor gets a blur event, and if the document activeElement is not inside
		// the VisualEditor, then it has lost focus
		if ( ! document.activeElement || ( containerEl && ! containerEl.contains( document.activeElement ) ) ) {
			dispatch( {
				type: 'EDITOR_LOST_FOCUS'
			} );
		}
	} } );

export default connect( mapStateToProps, mapDispatchToProps )( VisualEditor );
