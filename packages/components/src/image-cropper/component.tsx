/**
 * External dependencies
 */
import type { RefObject, ReactNode, MouseEvent, TouchEvent } from 'react';
import { useAnimate } from 'framer-motion';
/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useContext,
	useRef,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { Resizable, Draggable, Container, Img } from './styles';
import { ImageCropperContext } from './context';
import { useImageCropper } from './hook';
import type { Position } from './types';

const RESIZING_THRESHOLDS: [ number, number ] = [ 10, 10 ]; // 10px.
const MIN_PADDING = 20; // 20px;

function CropWindow() {
	const {
		state: {
			transforms: { scale },
			cropper,
			isResizing,
		},
		refs: { cropperWindowRef },
		dispatch,
	} = useContext( ImageCropperContext );
	const [ resizableScope, animate ] = useAnimate();
	const initialMousePositionRef = useRef< Position >( { x: 0, y: 0 } );

	useEffect( () => {
		if ( resizableScope.current ) {
			animate( [ resizableScope.current ], {
				'--wp-cropper-window-x': '0px',
				'--wp-cropper-window-y': '0px',
				width: `${ cropper.width }px`,
				height: `${ cropper.height }px`,
			} );
		}
	}, [ resizableScope, animate, cropper.width, cropper.height ] );

	return (
		<Resizable
			size={ {
				width: cropper.width,
				height: cropper.height,
			} }
			// maxWidth={ isAxisSwapped ? image.height : image.width }
			// maxHeight={ isAxisSwapped ? image.width : image.height }
			showHandle
			lockAspectRatio={ cropper.lockAspectRatio }
			// Emulate the resizing thresholds.
			grid={ isResizing ? undefined : RESIZING_THRESHOLDS }
			onResizeStart={ ( event ) => {
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
					if ( Math.abs( scale.x ) === 1 ) {
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
					const x =
						( [ 'left', 'topLeft', 'bottomLeft' ].includes(
							direction
						)
							? -delta.width
							: delta.width ) / 2;
					const y =
						( [ 'top', 'topLeft', 'topRight' ].includes( direction )
							? -delta.height
							: delta.height ) / 2;
					animate( [ resizableScope.current ], {
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
			ref={ resizableScope }
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
			transforms: { angle, rotations, scale },
			isDragging,
			isZooming,
		},
		src,
		originalWidth,
		originalHeight,
		refs: { imageRef },
		dispatch,
	} = useContext( ImageCropperContext );
	const isAxisSwapped = rotations % 2 !== 0;
	const degree = angle + rotations * 90;
	const aspectRatio = useMemo(
		() => originalWidth / originalHeight,
		[ originalWidth, originalHeight ]
	);
	const largerDimension = Math.max( image.width, image.height );

	const containerRef = useRef< HTMLDivElement >( null! );
	useEffect( () => {
		const container = containerRef.current;

		const resizeObserver = new ResizeObserver( ( [ entry ] ) => {
			const [ { inlineSize } ] = entry.contentBoxSize;
			const originalInlineSize = isAxisSwapped
				? originalHeight
				: originalWidth;

			dispatch( {
				type: 'RESIZE_CONTAINER',
				width:
					inlineSize < originalInlineSize
						? inlineSize
						: originalInlineSize,
			} );
		} );

		resizeObserver.observe( container );

		return () => {
			resizeObserver.disconnect();
		};
	}, [
		dispatch,
		originalWidth,
		originalHeight,
		aspectRatio,
		isAxisSwapped,
	] );

	return (
		<Container
			animate={ {
				'--wp-cropper-angle': `${ degree }deg`,
				...( isZooming
					? {}
					: {
							'--wp-cropper-scale-x': scale.x,
							'--wp-cropper-scale-y': scale.y,
					  } ),
				...( isDragging || isZooming
					? {}
					: {
							'--wp-cropper-image-x': `${ image.x }px`,
							'--wp-cropper-image-y': `${ image.y }px`,
					  } ),
			} }
			style={ {
				width: `${ largerDimension + MIN_PADDING * 2 }px`,
				aspectRatio: '1 / 1',
				'--wp-cropper-image-x': `${ image.x }px`,
				'--wp-cropper-image-y': `${ image.y }px`,
				'--wp-cropper-scale-x': scale.x,
				'--wp-cropper-scale-y': scale.y,
				padding: `${ MIN_PADDING }px`,
			} }
			ref={ useMergeRefs( [ containerRef, ref ] ) }
		>
			<Img
				width={ image.width }
				height={ image.height }
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

function ImageCropperAutoSizer( {
	src,
	width,
	height,
	children,
}: {
	src: string;
	width?: number;
	height?: number;
	children: ReactNode;
} ) {
	const [ size, setSize ] = useState< { width: number; height: number } >( {
		width: width || 0,
		height: height || 0,
	} );

	useEffect( () => {
		const image = new Image();
		image.src = src;
		if ( width ) {
			image.width = width;
		}
		if ( height ) {
			image.height = height;
		}

		function onLoadImage() {
			setSize( ( currentSize ) => {
				if (
					image.width === currentSize.width &&
					image.height === currentSize.height
				) {
					return currentSize;
				}
				return { width: image.width, height: image.height };
			} );
		}

		if ( image.complete ) {
			onLoadImage();
		}

		image.addEventListener( 'load', onLoadImage, false );

		return () => {
			image.removeEventListener( 'load', onLoadImage );
		};
	}, [ src, width, height ] );

	if ( ! size.width || ! size.height ) {
		return null;
	}

	return (
		<ImageCropperProvider
			src={ src }
			width={ size.width }
			height={ size.height }
		>
			{ children }
		</ImageCropperProvider>
	);
}

const ImageCropper = Object.assign( Cropper, {
	Provider: ImageCropperAutoSizer,
} );

export { ImageCropper };
