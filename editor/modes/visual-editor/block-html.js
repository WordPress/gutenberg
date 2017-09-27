/**
 * WordPress Dependencies
 */
import { isEqual } from 'lodash';
import { Component } from '@wordpress/element';
import { getBlockContent, getSourcedAttributes, getBlockType, isValidBlock } from '@wordpress/blocks';

/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import TextareaAutosize from 'react-autosize-textarea';

/**
 * Internal Dependencies
 */
import { updateBlock } from '../../actions';
import { getBlock } from '../../selectors';

class BlockHTML extends Component {
	constructor( props ) {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.onBlur = this.onBlur.bind( this );
		this.state = {
			html: props.block.isValid ? getBlockContent( props.block ) : props.block.originalContent,
			attributes: props.block.attributes,
		};
	}

	componentWillReceiveProps( nextProps ) {
		if ( ! isEqual( nextProps.block.attributes, this.state.attributes ) ) {
			this.setState( {
				html: getBlockContent( nextProps.block ),
			} );
		}
	}

	onBlur() {
		const blockType = getBlockType( this.props.block.name );
		const attributes = getSourcedAttributes( this.state.html, blockType.attributes );
		const isValid = isValidBlock( this.state.html, blockType, { ...this.props.block.attributes, attributes } );
		this.setState( { attributes } );
		this.props.onChange( this.props.uid, attributes, this.state.html, isValid );
	}

	onChange( event ) {
		this.setState( { html: event.target.value } );
	}

	render() {
		const { html } = this.state;
		return (
			<div className="blocks-visual-editor__block-html">
				<TextareaAutosize value={ html } onBlur={ this.onBlur } onChange={ this.onChange } />
			</div>
		);
	}
}

export default connect(
	( state, ownProps ) => ( {
		block: getBlock( state, ownProps.uid ),
	} ),
	{
		onChange( uid, attributes, originalContent, isValid ) {
			return updateBlock( uid, { attributes, originalContent, isValid } );
		},
	}
)( BlockHTML );
