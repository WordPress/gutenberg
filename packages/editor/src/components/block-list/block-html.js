
/**
 * External Dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';
import { isEqual } from 'lodash';

/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { getBlockAttributes, getBlockContent, getBlockType, getBlockStatus, isValidStatus } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';

class BlockHTML extends Component {
	constructor( props ) {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.onBlur = this.onBlur.bind( this );

		// Continue to use isValid here until support is removed, at which point switch to isValidStatus
		this.state = {
			html: props.block.isValid ? getBlockContent( props.block ) : props.block.originalContent,
		};
	}

	componentDidUpdate( prevProps ) {
		if ( ! isEqual( this.props.block.attributes, prevProps.block.attributes ) ) {
			this.setState( {
				html: getBlockContent( this.props.block ),
			} );
		}
	}

	onBlur() {
		const blockType = getBlockType( this.props.block.name );
		const attributes = getBlockAttributes( blockType, this.state.html, this.props.block.attributes );
		const blockStatus = getBlockStatus( this.state.html, blockType, attributes );
		const isValid = isValidStatus( blockStatus );

		this.props.onChange( this.props.clientId, attributes, this.state.html, isValid, blockStatus );
	}

	onChange( event ) {
		this.setState( { html: event.target.value } );
	}

	render() {
		const { html } = this.state;
		return (
			<TextareaAutosize
				className="editor-block-list__block-html-textarea"
				value={ html }
				onBlur={ this.onBlur }
				onChange={ this.onChange }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => ( {
		block: select( 'core/editor' ).getBlock( ownProps.clientId ),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		onChange( clientId, attributes, originalContent, isValid, blockStatus ) {
			dispatch( 'core/editor' ).updateBlock( clientId, { attributes, originalContent, isValid, blockStatus } );
		},
	} ) ),
] )( BlockHTML );
