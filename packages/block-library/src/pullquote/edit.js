/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Figure } from './figure';
import { BlockQuote } from './blockquote';
import CitationTextTransformControl from '../utils/citation-text-transform-control';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

function PullQuoteEdit( props ) {
	const { attributes, setAttributes, isSelected, insertBlocksAfter } = props;
	useDeprecatedTextAlign( props );
	const { citation, value, citationTextTransform } = attributes;
	const blockProps = useBlockProps();
	const shouldShowCitation = ! RichText.isEmpty( citation ) || isSelected;

	return (
		<>
			<InspectorControls group="styles">
				<PanelBody title={ __( 'Citation' ) }>
					<CitationTextTransformControl
						value={ citationTextTransform }
						onChange={ ( nextCitationTextTransform ) =>
							setAttributes( {
								citationTextTransform:
									nextCitationTextTransform,
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
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
							style={ {
								display: 'block',
								textTransform: citationTextTransform,
							} }
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
