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
		this.onReplace = this.onReplace.bind( this );
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
			onReplace,
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
					identifier="content"
					tagName="p"
					value={ content }
					isSelected={ this.props.isSelected }
					onFocus={ this.props.onFocus } // always assign onFocus as a props
					onBlur={ this.props.onBlur } // always assign onBlur as a props
					deleteEnter={ true }
					style={ style }
					onChange={ ( nextContent ) => {
						setAttributes( {
							content: nextContent,
						} );
					} }
					onSplit={ ( value ) => {
						if ( ! value ) {
							return createBlock( name );
						}

						return createBlock( name, {
							...attributes,
							content: value,
						} );
					} }
					onMerge={ mergeBlocks }
					onReplace={ onReplace }
					onRemove={ onReplace ? () => onReplace( [] ) : undefined }
					placeholder={ placeholder || __( 'Start writing…' ) }
				/>
			</View>
		);
	}
}

export default ParagraphEdit;
