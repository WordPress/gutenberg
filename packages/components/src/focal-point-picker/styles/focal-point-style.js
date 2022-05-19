/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { COLORS } from '../../utils';

export const FocalPointWrapper = styled.div`
	background-color: transparent;
	box-sizing: border-box;
	cursor: grab;
	height: 30px;
	margin: -15px 0 0 -15px;
	opacity: 0.8;
	position: absolute;
	user-select: none;
	width: 30px;
	will-change: transform;
	z-index: 10000;

	${ ( { isDragging } ) => isDragging && 'cursor: grabbing;' }
`;

export const PointerIconSVG = styled( SVG )`
	display: block;
	height: 100%;
	left: 0;
	position: absolute;
	top: 0;
	width: 100%;
`;

export const PointerIconPathOutline = styled( Path )`
	fill: white;
`;

export const PointerIconPathFill = styled( Path )`
	fill: ${ COLORS.blue.wordpress[ 700 ] };
	fill: ${ COLORS.ui.theme };
`;
