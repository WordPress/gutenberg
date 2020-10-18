/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
} from '@wordpress/block-editor';
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
		images,
	} = props;

	const {
		align,
		columns = defaultColumnsNumber( images ),
		caption,
		imageCrop,
	} = attributes;
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'blocks-gallery-grid',
		},
		{
			allowedBlocks: [ 'core/image' ],
			orientation: 'horizontal',
			renderAppender: false,
		}
	);
	return (
		<figure
			className={ classnames( className, {
				[ `align${ align }` ]: align,
				[ `columns-${ columns }` ]: columns,
				'is-cropped': imageCrop,
			} ) }
		>
			<ul { ...innerBlocksProps } />

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
