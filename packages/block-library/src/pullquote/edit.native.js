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
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Figure } from './figure';
import { BlockQuote } from './blockquote';
import { Caption } from '../utils/caption';

const isWebPlatform = Platform.OS === 'web';

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
	const { textAlign, value } = attributes;

	const blockProps = useBlockProps( {
		backgroundColor: getBackgroundColor( props ),
		borderColor: getBorderColor( props ),
	} );

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
					<Caption
						attributeKey="citation"
						tagName={ isWebPlatform ? 'cite' : undefined }
						style={ isWebPlatform && { display: 'block' } }
						isSelected={ isSelected }
						attributes={ attributes }
						setAttributes={ setAttributes }
						label={ __( 'Pullquote citation text' ) }
						placeholder={
							// translators: placeholder text used for the citation
							__( 'Add citation' )
						}
						addLabel={ __( 'Add citation' ) }
						removeLabel={ __( 'Remove citation' ) }
						className="wp-block-pullquote__citation"
						__unstableMobileNoFocusOnMount
						textAlign={ textAlign ?? 'center' }
						insertBlocksAfter={ insertBlocksAfter }
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter(
								createBlock( getDefaultBlockName() )
							)
						}
					/>
				</BlockQuote>
			</Figure>
		</>
	);
}

export default PullQuoteEdit;
