/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Figure } from './figure';
import { BlockQuote } from './blockquote';

/**
 * Internal dependencies
 */

function PullQuoteEdit( {
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
} ) {
	const { value, citation } = attributes;
	const blockProps = useBlockProps();
	const shouldShowCitation = ! RichText.isEmpty( citation ) || isSelected;

	return (
		<Figure { ...blockProps }>
			<BlockQuote>
				<RichText
					identifier="value"
					multiline
					value={ value }
					onChange={ ( nextValue ) =>
						setAttributes( {
							value: nextValue,
						} )
					}
					aria-label={ __( 'Pullquote text' ) }
					placeholder={
						// translators: placeholder text used for the quote
						__( 'Add quote' )
					}
					textAlign="center"
				/>
				{ shouldShowCitation && (
					<RichText
						identifier="citation"
						value={ citation }
						aria-label={ __( 'Pullquote citation text' ) }
						placeholder={
							// translators: placeholder text used for the citation
							__( 'Add citation' )
						}
						onChange={ ( nextCitation ) =>
							setAttributes( {
								citation: nextCitation,
							} )
						}
						className="wp-block-pullquote__citation"
						__unstableMobileNoFocusOnMount
						textAlign="center"
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter( createBlock( 'core/paragraph' ) )
						}
					/>
				) }
			</BlockQuote>
		</Figure>
	);
}

export default PullQuoteEdit;
