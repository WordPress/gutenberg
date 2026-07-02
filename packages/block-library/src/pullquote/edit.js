/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Figure } from './figure';
import { BlockQuote } from './blockquote';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

function PullQuoteEdit( props ) {
	const { attributes, setAttributes, isSelected, insertBlocksAfter } = props;
	useDeprecatedTextAlign( props );
	const { citation, value } = attributes;
	const blockProps = useBlockProps();
	const shouldShowCitation = ! RichText.isEmpty( citation ) || isSelected;

	return (
		<>
			<Figure { ...blockProps }>
				<BlockQuote>
					<RichText
						identifier="value"
						tagName="p"
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
					/>
					{ shouldShowCitation && (
						<RichText
							identifier="citation"
							tagName="cite"
							style={ { display: 'block' } }
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
							__unstableOnSplitAtEnd={ () =>
								insertBlocksAfter(
									createBlock( getDefaultBlockName() )
								)
							}
						/>
					) }
				</BlockQuote>
			</Figure>
		</>
	);
}

export default PullQuoteEdit;
