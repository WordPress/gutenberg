/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	AlignmentControl,
	BlockControls,
	RichText,
	useBlockProps,
	getColorObjectByAttributeValues,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Figure } from './figure';
import { BlockQuote } from './blockquote';

const getBackgroundColor = ( { attributes, colors, style } ) => {
	const { backgroundColor } = attributes;

	const colorProps = getColorClassesAndStyles( attributes );
	const colorObject = getColorObjectByAttributeValues(
		colors,
		backgroundColor
	);

	return (
		colorObject?.color ||
		colorProps.style?.backgroundColor ||
		colorProps.style?.background ||
		style?.backgroundColor
	);
};

const getTextColor = ( { attributes, colors, style } ) => {
	const colorProps = getColorClassesAndStyles( attributes );
	const colorObject = getColorObjectByAttributeValues(
		colors,
		attributes.textColor
	);
	return (
		colorObject?.color ||
		colorProps.style?.color ||
		style?.color ||
		style?.baseColors?.color?.text
	);
};
const getBorderColor = ( props ) => {
	const { wrapperProps } = props;
	const defaultColor = getTextColor( props );

	return wrapperProps?.style?.borderColor || defaultColor;
};
/**
 * Internal dependencies
 */

function PullQuoteEdit( props ) {
	const { attributes, setAttributes, isSelected, insertBlocksAfter } = props;
	const { textAlign, citation, value } = attributes;

	const blockProps = useBlockProps( {
		backgroundColor: getBackgroundColor( props ),
		borderColor: getBorderColor( props ),
	} );

	const shouldShowCitation = ! RichText.isEmpty( citation ) || isSelected;

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<Figure { ...blockProps }>
				<BlockQuote textColor={ getTextColor( props ) }>
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
						textAlign={ textAlign ?? 'center' }
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
							__unstableMobileNoFocusOnMount
							textAlign={ textAlign ?? 'center' }
							__unstableOnSplitAtEnd={ () =>
								insertBlocksAfter(
									createBlock( 'core/paragraph' )
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
