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
		return onBlur( e.relatedTarget, this._domElement );
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
	onBlur( focusedEl, containerEl ) {
		// if the VisualEditor gets a blur event, and if the document activeElement is not inside
		// the VisualEditor, then it has lost focus
		if ( ! focusedEl || ( containerEl && ! containerEl.contains( focusedEl ) ) ) {
			console.log( '>losing focus', focusedEl );
			dispatch( {
				type: 'FOCUS_LOST'
			} );
		} else {
			console.log( '>not losing focus', focusedEl );
		}
	} } );

export default connect( mapStateToProps, mapDispatchToProps )( VisualEditor );
