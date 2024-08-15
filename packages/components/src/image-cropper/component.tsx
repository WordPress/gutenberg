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
import { Resizable, Draggable, Container, Img, ReferenceFrame } from './styles';
import { ImageCropperContext } from './context';
import { useImageCropper } from './hook';
import type { Position } from './types';
import { matrixCSSToString, stateToMatrixCSS } from './math';

const RESIZING_THRESHOLDS: [ number, number ] = [ 10, 10 ]; // 10px.

function CropWindow() {
	const {
		state,
		refs: { cropperWindowRef },
		dispatch,
	} = useContext( ImageCropperContext );
	const { cropper, isResizing, isAspectRatioLocked } = state;
	const initialMousePositionRef = useRef< Position >( { x: 0, y: 0 } );

	return (
		<Resizable
			size={ {
				width: cropper.width,
				height: cropper.height,
			} }
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
				if ( ! isResizing ) {
					if (
						Math.abs( delta.width ) >= RESIZING_THRESHOLDS[ 0 ] ||
						Math.abs( delta.height ) >= RESIZING_THRESHOLDS[ 1 ]
					) {
						dispatch( { type: 'RESIZE_START' } );
					}
				}
			} }
			onResizeStop={ ( _event, direction, _element, delta ) => {
				dispatch( { type: 'RESIZE_WINDOW', direction, delta } );
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
		state,
		src,
		originalWidth,
		originalHeight,
		refs: { imageRef },
		dispatch,
	} = useContext( ImageCropperContext );
	const { image, isAxisSwapped } = state;
	const aspectRatio = useMemo(
		() => originalWidth / originalHeight,
		[ originalWidth, originalHeight ]
	);

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

	const transformCSS = matrixCSSToString( stateToMatrixCSS( state ) );

	return (
		<Container
			animate={
				{
					// '--wp-cropper-transform': transformCSS,
				}
			}
			style={ {
				'--wp-cropper-transform': transformCSS,
			} }
			ref={ useMergeRefs( [ containerRef, ref ] ) }
		>
			<ReferenceFrame
				style={ {
					width: `${ image.width }px`,
					height: `${ image.height }px`,
				} }
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
			</ReferenceFrame>
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
