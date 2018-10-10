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

class ParagraphEdit extends Component {
	constructor() {
		super( ...arguments );

		this.splitBlock = this.splitBlock.bind( this );
	}

	// eslint-disable-next-line no-unused-vars
	splitBlock( htmlText, start, end ) {
		const {
			insertBlocksAfter,
		} = this.props;

		if ( insertBlocksAfter ) {
			const blocks = [];
			blocks.push( createBlock( 'core/paragraph', { content: 'Test' } ) );
			insertBlocksAfter( blocks );
		}
	}

	render() {
		const {
			attributes,
			setAttributes,
			style,
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
						...style,
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
