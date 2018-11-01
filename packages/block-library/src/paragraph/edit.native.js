/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { parse, createBlock } from '@wordpress/blocks';
import { RichText } from '@wordpress/editor';

const minHeight = 50;

const name = 'core/paragraph';

class ParagraphEdit extends Component {
	constructor() {
		super( ...arguments );
		this.splitBlock = this.splitBlock.bind( this );
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
			// TODO : If before content is omitted, treat as intent to delete block.
			// onReplace( [] );
		} else if ( content !== before ) {
			// Only update content if it has in-fact changed. In case that user
			// has created a new paragraph at end of an existing one, the value
			// of before will be strictly equal to the current content.
			setAttributes( { content: before } );
		}
	}

	render() {
		const {
			attributes,
			setAttributes,
			mergeBlocks,
		} = this.props;

		const {
			placeholder,
			content,
		} = attributes;

		return (
			<View>
				<RichText
					tagName="p"
					value={ content }
					style={ {
						// We don't want to pass style here from upper leyers, because it's corrupted
						// (when a `className` prop is passed it gets converted to `style` here)
						// as we're using the react-native-classname-to-style plugin.
						minHeight: Math.max( minHeight, typeof attributes.aztecHeight === 'undefined' ? 0 : attributes.aztecHeight ),
					} }
					onChange={ ( event ) => {
						// Create a React Tree from the new HTML
						const newParaBlock = parse( '<!-- wp:paragraph --><p>' + event.content + '</p><!-- /wp:paragraph -->' )[ 0 ];
						setAttributes( {
							...this.props.attributes,
							content: newParaBlock.attributes.content,
						} );
					}
					}
					onSplit={ this.splitBlock }
					onMerge={ mergeBlocks }
					onContentSizeChange={ ( event ) => {
						setAttributes( {
							...this.props.attributes,
							aztecHeight: event.aztecHeight,
						} );
					}
					}
					placeholder={ placeholder || __( 'Add text or type / to add content' ) }
				/>
			</View>
		);
	}
}

export default ParagraphEdit;
