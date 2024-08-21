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
	useState,
} from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import {
	Resizable,
	Draggable,
	MaxWidthWrapper,
	Container,
	ContainWindow,
	Img,
	BackgroundImg,
} from './styles';
import { ImageCropperContext } from './context';
import { useImageCropper } from './hook';
import type { Position } from './types';

const RESIZING_THRESHOLDS: [ number, number ] = [ 10, 10 ]; // 10px.

function CropWindow( { children }: { children: ReactNode } ) {
	const {
		state: {
			transforms: { scale },
			cropper,
			isResizing,
			isAspectRatioLocked,
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
			lockAspectRatio={ isAspectRatioLocked }
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
			<Draggable ref={ cropperWindowRef as RefObject< HTMLDivElement > }>
				{ children }
			</Draggable>
		</Resizable>
	);
}

const Cropper = forwardRef< HTMLDivElement >( ( {}, ref ) => {
	const {
		state: {
			image,
			transforms: { rotate, scale, translate },
			cropper,
			isAxisSwapped,
			isResizing,
			isDragging,
			isZooming,
		},
		originalWidth,
		originalHeight,
		src,
		refs: { imageRef },
		dispatch,
	} = useContext( ImageCropperContext );

	const maxWidthWrapperRef = useRef< HTMLDivElement >( null! );
	useEffect( () => {
		const maxWidthWrapper = maxWidthWrapperRef.current;

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

		resizeObserver.observe( maxWidthWrapper );

		return () => {
			resizeObserver.disconnect();
		};
	}, [ dispatch, originalWidth, originalHeight, isAxisSwapped ] );

	return (
		<MaxWidthWrapper
			// Disable reason: We're using this ID as a namespace only to increase CSS specificity for this component.
			// eslint-disable-next-line no-restricted-syntax
			id="components-image-cropper"
			style={ {
				width: isAxisSwapped
					? `${ originalHeight }px`
					: `${ originalWidth }px`,
			} }
			ref={ useMergeRefs( [ maxWidthWrapperRef, ref ] ) }
		>
			<Container
				animate={ {
					width: `${ cropper.width }px`,
					height: `${ cropper.height }px`,
					'--wp-cropper-angle': `${ rotate }rad`,
					...( isZooming
						? {}
						: {
								'--wp-cropper-scale-x': scale.x,
								'--wp-cropper-scale-y': scale.y,
						  } ),
					...( isDragging || isZooming
						? {}
						: {
								'--wp-cropper-image-x': `${ translate.x }px`,
								'--wp-cropper-image-y': `${ translate.y }px`,
						  } ),
				} }
				style={ {
					'--wp-cropper-image-x': `${ translate.x }px`,
					'--wp-cropper-image-y': `${ translate.y }px`,
					'--wp-cropper-window-x': '0px',
					'--wp-cropper-window-y': '0px',
					'--wp-cropper-scale-x': scale.x,
					'--wp-cropper-scale-y': scale.y,
				} }
			>
				<BackgroundImg
					width={ image.width }
					height={ image.height }
					src={ src }
					alt=""
					crossOrigin="anonymous"
					isResizing={ isResizing }
					isDragging={ isDragging }
					style={ {
						width: `${ image.width }px`,
						height: `${ image.height }px`,
					} }
				/>
				<CropWindow>
					<ContainWindow>
						<Img
							width={ image.width }
							height={ image.height }
							src={ src }
							alt=""
							crossOrigin="anonymous"
							ref={ imageRef }
							style={ {
								width: `${ image.width }px`,
								height: `${ image.height }px`,
							} }
						/>
					</ContainWindow>
				</CropWindow>
			</Container>
		</MaxWidthWrapper>
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
