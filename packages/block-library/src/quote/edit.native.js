/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { RichText } from '@wordpress/editor';

const minHeight = 50;

class QuoteEdit extends Component {
	render() {
		const {
			attributes,
			setAttributes,
			style,
			mergeBlocks,
			onReplace,
			isSelected,
		} = this.props;

		const {
			placeholder,
			align,
			value,
			citation,
		} = attributes;

		return (
			<View style={ { textAlign: align } }>
				<RichText
					tagName="blockquote"
					multiline
					value={ value }
					style={ {
						...style,
						minHeight: Math.max( minHeight, typeof attributes.aztecHeight === 'undefined' ? 0 : attributes.aztecHeight ),
					} }
					onChange={ ( event ) => {
						// Create a React Tree from the new HTML
						const newQuoteBlock = parse( '<!-- wp:quote --><blockquote class="wp-block-quote">' + event.content + '</blockquote><!-- /wp:quote -->' )[ 0 ];
						setAttributes( {
							...this.props.attributes,
							value: newQuoteBlock.attributes.value,
						} );
					}
					}
					onContentSizeChange={ ( event ) => {
						setAttributes( {
							...this.props.attributes,
							aztecHeight: event.aztecHeight,
						} );
					}
					}
					onMerge={ mergeBlocks }
					onRemove={ ( forward ) => {
						const hasEmptyCitation = ! citation || citation.length === 0;
						if ( ! forward && hasEmptyCitation ) {
							onReplace( [] );
						}
					} }
					/* translators: the text of the quotation */
					placeholder={ placeholder || __( 'Write quote…' ) }
				/>
				{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
					<RichText
						tagName="cite"
						style={ {
							...style,
							minHeight: Math.max( minHeight, typeof attributes.aztecHeight === 'undefined' ? 0 : attributes.aztecHeight ),
						} }
						value={ citation }
						onChange={
							( event ) => {
								// TODO: remove this fix
								const openingTagRegexp = RegExp( '<cite>', 'gim' );
								const closingTagRegexp = RegExp( '</cite>', 'gim' );
								let newCiteVaule = event.content;
								newCiteVaule = newCiteVaule.replace( openingTagRegexp, '' ).replace( closingTagRegexp, '' );
								setAttributes( {
									...this.props.attributes,
									citation: newCiteVaule,
								} );
							}
						}
						onContentSizeChange={ ( event ) => {
							setAttributes( {
								...this.props.attributes,
								aztecHeight: event.aztecHeight,
							} );
						}
						}
						/* translators: the individual or entity quoted */
						placeholder={ placeholder || __( 'Write citation…' ) }
						className="wp-block-quote__citation"
					/>
				) }
			</View>
		);
	}
}

export default QuoteEdit;
