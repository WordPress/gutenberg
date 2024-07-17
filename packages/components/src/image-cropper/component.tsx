/**
 * External dependencies
 */
import type { RefObject, ReactNode, MouseEvent, TouchEvent } from 'react';
/**
 * WordPress dependencies
 */
import { useState, forwardRef, useContext, useRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { Resizable, Draggable, Container, Img } from './styles';
import { ImageCropperContext } from './context';
import { useImageCropper } from './hook';
import type { Position } from './types';

const RESIZING_THRESHOLDS: [ number, number ] = [ 10, 10 ]; // 10px.

function CropWindow() {
	const {
		state: { size, offset, scale, isResizing },
		refs: { cropperWindowRef },
		dispatch,
	} = useContext( ImageCropperContext );
	const [ element, setElement ] = useState< HTMLDivElement >();
	const initialMousePositionRef = useRef< Position >( { x: 0, y: 0 } );

	return (
		<Resizable
			size={ size }
			// maxWidth={ width }
			// maxHeight={ height }
			showHandle
			// Emulate the resizing thresholds.
			grid={ isResizing ? undefined : RESIZING_THRESHOLDS }
			onResizeStart={ ( event ) => {
				// Set the temporary offset on resizing.
				element!.style.setProperty(
					'--wp-cropper-x',
					`${ offset.x }px`
				);
				element!.style.setProperty(
					'--wp-cropper-y',
					`${ offset.y }px`
				);

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
					// Set the temporary offset on resizing.
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
		state: { width, height, angle, turns, scale, offset, position },
		src,
		refs: { imageRef },
	} = useContext( ImageCropperContext );
	const isAxisSwapped = turns % 2 !== 0;
	const degree = angle + turns * 90;
	const imageOffset = {
		top: isAxisSwapped ? ( width - height ) / 2 : 0,
		left: isAxisSwapped ? ( height - width ) / 2 : 0,
	};

	return (
		<Container
			style={ {
				width: `${ isAxisSwapped ? height : width }px`,
				height: `${ isAxisSwapped ? width : height }px`,
				'--wp-cropper-angle': `${ degree }deg`,
				'--wp-cropper-scale': `${ scale }`,
				'--wp-cropper-x': `${ offset.x }px`,
				'--wp-cropper-y': `${ offset.y }px`,
				'--wp-cropper-image-x': `${ position.x }px`,
				'--wp-cropper-image-y': `${ position.y }px`,
			} }
			ref={ ref }
		>
			<div style={ { position: 'relative' } }>
				<Img
					width={ width }
					height={ height }
					src={ src }
					alt=""
					crossOrigin="anonymous"
					ref={ imageRef }
					style={ imageOffset }
				/>
			</div>
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
