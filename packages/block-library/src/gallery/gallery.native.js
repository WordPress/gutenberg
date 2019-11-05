/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import GalleryImage from './gallery-image';
import { defaultColumnsNumber } from './shared';
import Tiles from './tiles';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

export const Gallery = ( props ) => {
	const {
		selectedImage,
		mediaPlaceholder,
		onMoveBackward,
		onMoveForward,
		onRemoveImage,
		onSelectImage,
		onSetImageAttributes,
		//	onFocusGalleryCaption,
		attributes,
		isSelected,
		//	setAttributes,
		isMobile,
	} = props;

	const {
		align,
		columns = defaultColumnsNumber( attributes ),
		imageCrop,
		images,
	} = attributes;

	const displayedColumns = isMobile ? Math.min( columns, 2 ) : columns;

	return (
		<View>
			<Tiles
				columns={ displayedColumns }
				spacing={ 15 }
				align={ align }
			>
				{ images.map( ( img, index ) => {
					/* translators: %1$d is the order number of the image, %2$d is the total number of images. */
					const ariaLabel = sprintf( __( 'image %1$d of %2$d in gallery' ), ( index + 1 ), images.length );

					return (
						<GalleryImage
							key={ img.id || img.url }
							url={ img.url }
							alt={ img.alt }
							id={ img.id }
							isCropped={ imageCrop }
							isFirstItem={ index === 0 }
							isLastItem={ ( index + 1 ) === images.length }
							isSelected={ isSelected && selectedImage === index }
							isBlockSelected={ isSelected }
							onMoveBackward={ onMoveBackward( index ) }
							onMoveForward={ onMoveForward( index ) }
							onRemove={ onRemoveImage( index ) }
							onSelect={ onSelectImage( index ) }
							setAttributes={ ( attrs ) => onSetImageAttributes( index, attrs ) }
							caption={ img.caption }
							aria-label={ ariaLabel }
						/>
					);
				} ) }
			</Tiles>
			{ mediaPlaceholder }
		</View>
	);
};

export default Gallery;
