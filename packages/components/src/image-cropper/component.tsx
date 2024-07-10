/**
 * External dependencies
 */
import type { RefObject, ReactNode } from 'react';
/**
 * WordPress dependencies
 */
import { useState, forwardRef, useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { Resizable, Draggable, Container, Img } from './styles';
import { getRotatedScale } from './math';
import { ImageCropperContext } from './context';
import { useImageCropper } from './hook';

function CropWindow() {
	const {
		state: { size, offset },
		width,
		height,
		refs: { cropperWindowRef },
		dispatch,
	} = useContext( ImageCropperContext );
	const [ element, setElement ] = useState< HTMLDivElement >();

	return (
		<Resizable
			size={ size }
			maxWidth={ width }
			maxHeight={ height }
			showHandle
			onResizeStart={ () => {
				// setMaxSize((maxSize) => {
				//   let maxWidth = maxSize.width;
				//   let maxHeight = maxSize.height;
				//   if (direction.toLowerCase().includes('left')) {
				//     maxWidth = offset.x + size.width;
				//   }
				//   if (direction.toLowerCase().includes('right')) {
				//     maxWidth = containerWidth - offset.x;
				//   }
				//   if (direction.startsWith('top')) {
				//     maxHeight = offset.y + size.height;
				//   }
				//   if (direction.startsWith('bottom')) {
				//     maxHeight = containerHeight - offset.y;
				//   }
				//   // Bail out updates if the states are the same.
				//   if (maxWidth === maxSize.width && maxHeight === maxSize.height) {
				//     return maxSize;
				//   }
				//   return { width: maxWidth, height: maxHeight };
				// });

				// Set the temporaray offset on resizing.
				element!.style.setProperty(
					'--wp-cropper-x',
					`${ offset.x }px`
				);
				element!.style.setProperty(
					'--wp-cropper-y',
					`${ offset.y }px`
				);
			} }
			onResize={ ( _event, direction, _element, delta ) => {
				// Set the temporaray offset on resizing.
				if ( direction.toLowerCase().includes( 'left' ) ) {
					element!.style.setProperty(
						'--wp-cropper-x',
						`${ offset.x - delta.width }px`
					);
				}
				if ( direction.startsWith( 'top' ) ) {
					element!.style.setProperty(
						'--wp-cropper-y',
						`${ offset.y - delta.height }px`
					);
				}
			} }
			onResizeStop={ ( _event, direction, _element, delta ) => {
				// Remove the temporary offset.
				element!.style.removeProperty( '--wp-cropper-x' );
				element!.style.removeProperty( '--wp-cropper-y' );
				// Commit the offset to state if needed.
				dispatch( { type: 'RESIZE_WINDOW', direction, delta } );
			} }
			ref={ ( resizable ) => {
				if ( resizable ) {
					setElement( resizable.resizable as HTMLDivElement );
				}
			} }
		>
			<Draggable
				ref={ cropperWindowRef as RefObject< HTMLDivElement > }
			/>
		</Resizable>
	);
}

const Cropper = forwardRef< HTMLDivElement >( ( {}, ref ) => {
	const {
		state: { angle, scale, offset, position },
		src,
		width,
		height,
		refs: { imageRef },
	} = useContext( ImageCropperContext );
	const rotatedScale = getRotatedScale( angle, scale, width, height );

	return (
		<Container
			style={ {
				width,
				height,
				'--wp-cropper-angle': `${ angle }deg`,
				'--wp-cropper-scale': `${ rotatedScale }`,
				'--wp-cropper-x': `${ offset.x }px`,
				'--wp-cropper-y': `${ offset.y }px`,
				'--wp-cropper-image-x': `${ position.x }px`,
				'--wp-cropper-image-y': `${ position.y }px`,
			} }
			ref={ ref }
		>
			<Img
				width={ width }
				height={ height }
				src={ src }
				alt=""
				crossOrigin="anonymous"
				ref={ imageRef }
			/>
			<CropWindow />
		</Container>
	);
} );

function ImageCropperProvider( {
	src,
	width,
	height,
	children,
}: {
	src: string;
	width: number;
	height: number;
	children: ReactNode;
} ) {
	const context = useImageCropper( { src, width, height } );
	return (
		<ImageCropperContext.Provider value={ context }>
			{ children }
		</ImageCropperContext.Provider>
	);
}

const ImageCropper = Object.assign( Cropper, {
	Provider: ImageCropperProvider,
} );

export { ImageCropper };
