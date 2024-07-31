/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import type { ComponentProps } from 'react';
/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import ResizableBox from '../resizable-box';

export const Draggable = styled.div`
	position: absolute;
	inset: 0;
	cursor: move;
	touch-action: none;
	overscroll-behavior: none;
`;

const MotionResizable = motion(
	forwardRef< HTMLDivElement, ComponentProps< typeof ResizableBox > >(
		( props, ref ) => {
			const updateRef = ( element: HTMLDivElement | null ) => {
				if ( typeof ref === 'function' ) {
					ref( element );
				} else if ( ref ) {
					ref.current = element;
				}
			};

			return (
				<ResizableBox
					{ ...props }
					ref={ ( resizable ) => {
						updateRef(
							resizable?.resizable as HTMLDivElement | null
						);
					} }
				/>
			);
		}
	)
);

export const Resizable = styled( MotionResizable )`
	translate: var( --wp-cropper-window-x ) var( --wp-cropper-window-y );
	box-shadow: 0 0 0 100vmax rgba( 0, 0, 0, 0.5 );
	will-change: translate;
	contain: layout size style;

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
	contain: strict;
	max-width: 100%;
	box-sizing: border-box;
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
