/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { VisuallyHidden } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import GalleryImage from './gallery-image';
import { defaultColumnsNumberV1 } from '../deprecated';

export const Gallery = ( props ) => {
	const {
		attributes,
		isSelected,
		setAttributes,
		selectedImage,
		mediaPlaceholder,
		onMoveBackward,
		onMoveForward,
		onRemoveImage,
		onSelectImage,
		onDeselectImage,
		onSetImageAttributes,
		onFocusGalleryCaption,
		insertBlocksAfter,
		blockProps,
	} = props;

	const {
		align,
		columns = defaultColumnsNumberV1( attributes ),
		caption,
		imageCrop,
		images,
	} = attributes;

	return (
		<figure
			{ ...blockProps }
			className={ classnames( blockProps.className, {
				[ `align${ align }` ]: align,
				[ `columns-${ columns }` ]: columns,
				'is-cropped': imageCrop,
			} ) }
		>
			<ul className="blocks-gallery-grid">
				{ images.map( ( img, index ) => {
					const ariaLabel = sprintf(
						/* translators: 1: the order number of the image. 2: the total number of images. */
						__( 'image %1$d of %2$d in gallery' ),
						index + 1,
						images.length
					);

					return (
						<li
							className="blocks-gallery-item"
							key={ img.id || img.url }
						>
							<GalleryImage
								url={ img.url }
								alt={ img.alt }
								id={ img.id }
								isFirstItem={ index === 0 }
								isLastItem={ index + 1 === images.length }
								isSelected={
									isSelected && selectedImage === index
								}
								onMoveBackward={ onMoveBackward( index ) }
								onMoveForward={ onMoveForward( index ) }
								onRemove={ onRemoveImage( index ) }
								onSelect={ onSelectImage( index ) }
								onDeselect={ onDeselectImage( index ) }
								setAttributes={ ( attrs ) =>
									onSetImageAttributes( index, attrs )
								}
								caption={ img.caption }
								aria-label={ ariaLabel }
								sizeSlug={ attributes.sizeSlug }
							/>
						</li>
					);
				} ) }
			</ul>
			{ mediaPlaceholder }
			<RichTextVisibilityHelper
				isHidden={ ! isSelected && RichText.isEmpty( caption ) }
				tagName="figcaption"
				className="blocks-gallery-caption"
				aria-label={ __( 'Gallery caption text' ) }
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
