/**
 * Internal dependencies
 */
import HeadingToolbar from './heading-toolbar';
import styles from './editor.scss';

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
import { RichText, BlockControls } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { create } from '@wordpress/rich-text';

const name = 'core/heading';

class HeadingEdit extends Component {
	constructor( props ) {
		super( props );

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
			onReplace,
		} = this.props;

		if ( after ) {
			// Append "After" content as a new heading block to the end of
			// any other blocks being inserted after the current heading.
			const newBlock = createBlock( name, { content: after } );
			blocks.push( newBlock );
		} else {
			const newBlock = createBlock( 'core/paragraph', { content: after } );
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
			level,
			placeholder,
			content,
		} = attributes;

		const tagName = 'h' + level;

		return (
			<View
				accessible={ ! this.props.isSelected }
				accessibilityLabel={
					isEmpty( content ) ?
						/* translators: %s: heading level. */
						sprintf(
							__( 'Heading block. Level %s. Empty.' ),
							level
						) :
						/* translators: 1: heading level. 2: heading content. */
						sprintf(
							__( 'Heading block. Level %s1$s. %2$s' ),
							level,
							this.plainTextContent( content )
						)
				}
				onAccessibilityTap={ this.props.onFocus }
			>
				<BlockControls>
					<HeadingToolbar minLevel={ 2 } maxLevel={ 5 } selectedLevel={ level } onChange={ ( newLevel ) => setAttributes( { level: newLevel } ) } />
				</BlockControls>
				<RichText
					tagName={ tagName }
					value={ content }
					isSelected={ this.props.isSelected }
					style={ {
						...style,
						minHeight: styles[ 'wp-block-heading' ].minHeight,
					} }
					onFocus={ this.props.onFocus } // always assign onFocus as a props
					onBlur={ this.props.onBlur } // always assign onBlur as a props
					onCaretVerticalPositionChange={ this.props.onCaretVerticalPositionChange }
					onChange={ ( value ) => setAttributes( { content: value } ) }
					onMerge={ mergeBlocks }
					onSplit={ this.splitBlock }
					placeholder={ placeholder || __( 'Write heading…' ) }
				/>
			</View>
		);
	}
}
export default HeadingEdit;
