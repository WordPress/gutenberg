/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';

export const Gallery = ( props ) => {
	const {
		attributes,
		className,
		isSelected,
		setAttributes,
		mediaPlaceholder,
		onFocusGalleryCaption,
		insertBlocksAfter,
	} = props;

	const {
		align,
		columns = defaultColumnsNumber( attributes ),
		caption,
		imageCrop,
	} = attributes;

	return (
		<figure
			className={ classnames( className, {
				[ `align${ align }` ]: align,
				[ `columns-${ columns }` ]: columns,
				'is-cropped': imageCrop,
			} ) }
		>
			<InnerBlocks
				allowedBlocks={ [ 'core/image' ] }
				__experimentalTagName="ul"
			/>

			{ mediaPlaceholder }
			<RichTextVisibilityHelper
				isHidden={ ! isSelected && RichText.isEmpty( caption ) }
				tagName="figcaption"
				className="blocks-gallery-caption"
				placeholder={ __( 'Write gallery caption…' ) }
				value={ caption }
				unstableOnFocus={ onFocusGalleryCaption }
				onChange={ ( value ) => setAttributes( { caption: value } ) }
				inlineToolbar
				__unstableOnSplitAtEnd={ () =>
					insertBlocksAfter( createBlock( 'core/paragraph' ) )
				}
			/>
		</figure>
	);
};

function RichTextVisibilityHelper( { isHidden, ...richTextProps } ) {
	return isHidden ? (
		<VisuallyHidden as={ RichText } { ...richTextProps } />
	) : (
		<RichText { ...richTextProps } />
	);
}

export default Gallery;
