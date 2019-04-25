/**
 * External dependencies
 */
import { View } from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';
import { create } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */

const name = 'core/paragraph';

class ParagraphEdit extends Component {
	constructor( props ) {
		super( props );
		this.splitBlock = this.splitBlock.bind( this );
		this.onReplace = this.onReplace.bind( this );
	}

	/**
	 * Split handler for RichText value, namely when content is pasted or the
	 * user presses the Enter key.
	 *
	 * @param {?Array}     before Optional before value, to be used as content
	 *                            in place of what exists currently for the
	 *                            block. If undefined, the block is deleted.
	 * @param {?Array}     after  Optional after value, to be appended in a new
	 *                            paragraph block to the set of blocks passed
	 *                            as spread.
	 * @param {...WPBlock} blocks Optional blocks inserted between the before
	 *                            and after value blocks.
	 */
	splitBlock( before, after, ...blocks ) {
		const {
			attributes,
			insertBlocksAfter,
			setAttributes,
			onReplace,
		} = this.props;

		if ( after !== null ) {
			// Append "After" content as a new paragraph block to the end of
			// any other blocks being inserted after the current paragraph.
			const newBlock = createBlock( name, { content: after } );
			blocks.push( newBlock );
		}

		if ( blocks.length && insertBlocksAfter ) {
			insertBlocksAfter( blocks );
		}

		const { content } = attributes;
		if ( before === null ) {
			onReplace( [] );
		} else if ( content !== before ) {
			// Only update content if it has in-fact changed. In case that user
			// has created a new paragraph at end of an existing one, the value
			// of before will be strictly equal to the current content.
			setAttributes( { content: before } );
		}
	}

	onReplace( blocks ) {
		const { attributes, onReplace } = this.props;
		onReplace( blocks.map( ( block, index ) => (
			index === 0 && block.name === name ?
				{ ...block,
					attributes: {
						...attributes,
						...block.attributes,
					},
				} :
				block
		) ) );
	}

	plainTextContent( html ) {
		const result = create( { html } );
		if ( result ) {
			return result.text;
		}
		return '';
	}

	render() {
		const {
			attributes,
			setAttributes,
			mergeBlocks,
			style,
		} = this.props;

		const {
			placeholder,
			content,
		} = attributes;

		return (
			<View
				accessible={ ! this.props.isSelected }
				accessibilityLabel={
					isEmpty( content ) ?
					/* translators: accessibility text. empty paragraph block. */
						__( 'Paragraph block. Empty' ) :
						sprintf(
						/* translators: accessibility text. %s: text content of the paragraph block. */
							__( 'Paragraph block. %s' ),
							this.plainTextContent( content )
						)
				}
				onAccessibilityTap={ this.props.onFocus }
			>
				<RichText
					tagName="p"
					value={ content }
					isSelected={ this.props.isSelected }
					onFocus={ this.props.onFocus } // always assign onFocus as a props
					onBlur={ this.props.onBlur } // always assign onBlur as a props
					onCaretVerticalPositionChange={ this.props.onCaretVerticalPositionChange }
					style={ style }
					onChange={ ( nextContent ) => {
						setAttributes( {
							content: nextContent,
						} );
					} }
					onSplit={ this.splitBlock }
					onMerge={ mergeBlocks }
					onReplace={ this.onReplace }
					placeholder={ placeholder || __( 'Start writing…' ) }
				/>
			</View>
		);
	}
}

export default ParagraphEdit;
