/**
 * External dependencies
 */
import type { RefObject, ReactNode, MouseEvent, TouchEvent } from 'react';
import { animate } from 'framer-motion';
/**
 * WordPress dependencies
 */
import {
	useState,
	forwardRef,
	useContext,
	useRef,
	useEffect,
} from '@wordpress/element';
/**
 * Internal dependencies
 */
import { Resizable, Draggable, Container, Img, PADDING } from './styles';
import { ImageCropperContext } from './context';
import { useImageCropper } from './hook';
import type { Position } from './types';

const RESIZING_THRESHOLDS: [ number, number ] = [ 10, 10 ]; // 10px.

function CropWindow() {
	const {
		state: {
			image,
			transforms: { rotations, scale },
			cropper,
			isResizing,
		},
		refs: { cropperWindowRef },
		dispatch,
	} = useContext( ImageCropperContext );
	const [ element, setElement ] = useState< HTMLDivElement >( null! );
	const initialMousePositionRef = useRef< Position >( { x: 0, y: 0 } );
	const isAxisSwapped = rotations % 2 !== 0;

	useEffect( () => {
		if ( element ) {
			animate( element, {
				'--wp-cropper-window-x': `${ cropper.x }px`,
				'--wp-cropper-window-y': `${ cropper.y }px`,
				width: `${ cropper.width }px`,
				height: `${ cropper.height }px`,
			} );
		}
	}, [ element, cropper.x, cropper.y, cropper.width, cropper.height ] );

	return (
		<Resizable
			size={ {
				width: cropper.width,
				height: cropper.height,
			} }
			maxWidth={ isAxisSwapped ? image.height : image.width }
			maxHeight={ isAxisSwapped ? image.width : image.height }
			showHandle
			// Emulate the resizing thresholds.
			grid={ isResizing ? undefined : RESIZING_THRESHOLDS }
			onResizeStart={ ( event ) => {
				// Set the temporary offset on resizing.
				animate( element, {
					'--wp-cropper-window-x': `${ cropper.x }px`,
					'--wp-cropper-window-y': `${ cropper.y }px`,
				} ).complete();

				if ( event.type === 'mousedown' ) {
					const mouseEvent = event as MouseEvent;
					initialMousePositionRef.current = {
						x: mouseEvent.clientX,
						y: mouseEvent.clientY,
					};
				} else if ( event.type === 'touchstart' ) {
					const touch = ( event as TouchEvent ).touches[ 0 ];
					initialMousePositionRef.current = {
						x: touch.clientX,
						y: touch.clientY,
					};
				}
			} }
			onResize={ ( _event, direction, _element, delta ) => {
				if ( delta.width === 0 && delta.height === 0 ) {
					if ( scale === 1 ) {
						return;
					}
					// let x = 0;
					// let y = 0;
					// if ( event.type === 'mousemove' ) {
					// 	const mouseEvent = event as unknown as MouseEvent;
					// 	x =
					// 		mouseEvent.clientX -
					// 		initialMousePositionRef.current.x;
					// 	y =
					// 		mouseEvent.clientY -
					// 		initialMousePositionRef.current.y;
					// } else if ( event.type === 'touchmove' ) {
					// 	const touch = ( event as unknown as TouchEvent )
					// 		.touches[ 0 ];
					// 	x = touch.clientX - initialMousePositionRef.current.x;
					// 	y = touch.clientY - initialMousePositionRef.current.y;
					// }
				}
				if ( ! isResizing ) {
					if (
						Math.abs( delta.width ) >= RESIZING_THRESHOLDS[ 0 ] ||
						Math.abs( delta.height ) >= RESIZING_THRESHOLDS[ 1 ]
					) {
						dispatch( { type: 'RESIZE_START' } );
					}
				} else {
					let { x, y } = cropper;
					if (
						[ 'left', 'topLeft', 'bottomLeft' ].includes(
							direction
						)
					) {
						x -= delta.width;
					}
					if (
						[ 'top', 'topLeft', 'topRight' ].includes( direction )
					) {
						y -= delta.height;
					}
					animate( element, {
						'--wp-cropper-window-x': `${ x }px`,
						'--wp-cropper-window-y': `${ y }px`,
						width: `${ cropper.width + delta.width }px`,
						height: `${ cropper.height + delta.height }px`,
					} ).complete();
				}
			} }
			onResizeStop={ ( _event, direction, _element, delta ) => {
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
		state: {
			image,
			transforms: { angle, rotations, scale, flipped },
			isDragging,
		},
		src,
		refs: { imageRef },
	} = useContext( ImageCropperContext );
	const isAxisSwapped = rotations % 2 !== 0;
	const degree = angle + rotations * 90;
	const imageOffset = {
		top: isAxisSwapped
			? PADDING.y + ( image.width - image.height ) / 2
			: PADDING.y,
		left: isAxisSwapped
			? PADDING.x + ( image.height - image.width ) / 2
			: PADDING.x,
	};

	return (
		<Container
			animate={ {
				'--wp-cropper-angle': `${ degree }deg`,
				'--wp-cropper-scale-x':
					scale * ( flipped && ! isAxisSwapped ? -1 : 1 ),
				'--wp-cropper-scale-y':
					scale * ( flipped && isAxisSwapped ? -1 : 1 ),
				...( isDragging
					? {}
					: {
							'--wp-cropper-image-x': `${ image.x }px`,
							'--wp-cropper-image-y': `${ image.y }px`,
					  } ),
			} }
			style={ {
				width: `${ isAxisSwapped ? image.height : image.width }px`,
				height: `${ isAxisSwapped ? image.width : image.height }px`,
				'--wp-cropper-image-x': `${ image.x }px`,
				'--wp-cropper-image-y': `${ image.y }px`,
			} }
			ref={ ref }
		>
			<Img
				width={ image.width }
				height={ image.height }
				src={ src }
				alt=""
				crossOrigin="anonymous"
				ref={ imageRef }
				style={ imageOffset }
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
