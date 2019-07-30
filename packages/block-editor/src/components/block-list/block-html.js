
/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { getBlockAttributes, getBlockContent, getBlockType, isValidBlockContent, getSaveContent } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';

export class BlockHTML extends Component {
	constructor( props ) {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.onBlur = this.onBlur.bind( this );
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
		const { html } = this.state;
		const blockType = getBlockType( this.props.block.name );
		const attributes = getBlockAttributes( blockType, html, this.props.block.attributes );

		// If html is empty  we reset the block to the default HTML and mark it as valid to avoid triggering an error
		const content = html ? html : getSaveContent( blockType, attributes );
		const isValid = html ? isValidBlockContent( blockType, attributes, content ) : true;

		this.props.onChange( this.props.clientId, attributes, content, isValid );

		// Ensure the state is updated if we reset so it displays the default content
		if ( ! html ) {
			this.setState( { html: content } );
		}
	}

	onChange( event ) {
		this.setState( { html: event.target.value } );
	}

	render() {
		const { html } = this.state;
		return (
			<TextareaAutosize
				className="editor-block-list__block-html-textarea block-editor-block-list__block-html-textarea"
				value={ html }
				onBlur={ this.onBlur }
				onChange={ this.onChange }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => ( {
		block: select( 'core/block-editor' ).getBlock( ownProps.clientId ),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		onChange( clientId, attributes, originalContent, isValid ) {
			dispatch( 'core/block-editor' ).updateBlock( clientId, { attributes, originalContent, isValid } );
		},
	} ) ),
] )( BlockHTML );
