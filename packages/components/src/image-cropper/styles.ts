/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import ResizableBox from '../resizable-box';

export const PADDING = {
	x: 30,
	y: 30,
};

export const Draggable = styled.div`
	position: absolute;
	inset: 0;
	cursor: move;
	touch-action: none;
`;

export const Resizable = styled( ResizableBox )`
	transform: translate(
		var( --wp-cropper-window-x ),
		var( --wp-cropper-window-y )
	);
	box-shadow: 0 0 0 100vmax rgba( 0, 0, 0, 0.5 );
	will-change: transform;
	contain: layout size style;
`;

export const Container = styled.div`
	position: relative;
	display: flex;
	overflow: hidden;
	padding: ${ PADDING.y }px ${ PADDING.x }px;
	box-sizing: content-box;
	contain: strict;
`;

export const Img = styled.img`
	position: absolute;
	pointer-events: none;
	transform-origin: center center;
	rotate: var( --wp-cropper-angle );
	scale: var( --wp-cropper-scale-x ) var( --wp-cropper-scale-y );
	translate: var( --wp-cropper-image-x ) var( --wp-cropper-image-y );
	will-change: transform;
	contain: strict;
`;
