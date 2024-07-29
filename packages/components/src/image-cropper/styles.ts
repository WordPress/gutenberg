/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

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
	translate: var( --wp-cropper-window-x ) var( --wp-cropper-window-y );
	box-shadow: 0 0 0 100vmax rgba( 0, 0, 0, 0.5 );
	will-change: translate;
	contain: layout, size, style;

	&:active {
		&::after,
		&::before,
		${ Draggable }::after, ${ Draggable }::before {
			content: ' ';
			position: absolute;
			display: block;
			width: 1px;
			height: 100%;
			overflow: hidden;
			left: 33.33%;
			background: rgba( 255, 255, 255, 0.33 );
		}

		&::before {
			right: 33.33%;
			left: auto;
		}

		${ Draggable }::before {
			left: auto;
			width: 100%;
			height: 1px;
			top: 33.33%;
		}

		${ Draggable }::after {
			left: auto;
			width: 100%;
			height: 1px;
			bottom: 33.33%;
			top: auto;
		}
	}
`;

export const Container = styled( motion.div )`
	position: relative;
	display: flex;
	overflow: hidden;
	padding: ${ PADDING.y }px ${ PADDING.x }px;
	box-sizing: content-box;
	contain: strict;
`;

export const Img = styled( motion.img )`
	position: absolute;
	pointer-events: none;
	transform-origin: center center;
	rotate: var( --wp-cropper-angle );
	scale: var( --wp-cropper-scale-x ) var( --wp-cropper-scale-y );
	translate: var( --wp-cropper-image-x ) var( --wp-cropper-image-y );
	will-change: rotate, scale, translate;
	contain: strict;
`;
