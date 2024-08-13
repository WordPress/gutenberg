/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { Flex } from '../../flex';
import UnitControl from '../../unit-control';
import { COLORS, CONFIG } from '../../utils';
import type { FocalPointPickerControlsProps } from '../types';
import { INITIAL_BOUNDS } from '../utils';

export const MediaWrapper = styled.div`
	background-color: transparent;
	display: flex;
	text-align: center;
	width: 100%;
`;

export const MediaContainer = styled.div`
	align-items: center;
	border-radius: ${ CONFIG.radiusBlockUi };
	cursor: pointer;
	display: inline-flex;
	justify-content: center;
	margin: auto;
	position: relative;
	height: 100%;

	&:after {
		border-radius: inherit;
		bottom: 0;
		box-shadow: inset 0 0 0 1px rgba( 0, 0, 0, 0.1 );
		content: '';
		left: 0;
		pointer-events: none;
		position: absolute;
		right: 0;
		top: 0;
	}

	img,
	video {
		border-radius: inherit;
		box-sizing: border-box;
		display: block;
		height: auto;
		margin: 0;
		max-height: 100%;
		max-width: 100%;
		pointer-events: none;
		user-select: none;
		width: auto;
	}
`;

export const MediaPlaceholder = styled.div`
	background: ${ COLORS.gray[ 100 ] };
	border-radius: inherit;
	box-sizing: border-box;
	height: ${ INITIAL_BOUNDS.height }px;
	max-width: 280px;
	min-width: ${ INITIAL_BOUNDS.width }px;
	width: 100%;
`;

export const StyledUnitControl = styled( UnitControl )`
	width: 100%;
`;

const deprecatedBottomMargin = ( {
	__nextHasNoMarginBottom,
}: FocalPointPickerControlsProps ) => {
	return ! __nextHasNoMarginBottom
		? css`
				padding-bottom: 1em;
		  `
		: undefined;
};

const extraHelpTextMargin = ( {
	hasHelpText = false,
}: FocalPointPickerControlsProps ) => {
	return hasHelpText
		? css`
				padding-bottom: 1em;
		  `
		: undefined;
};

export const ControlWrapper = styled( Flex )`
	max-width: 320px;
	padding-top: 1em;

	${ extraHelpTextMargin }
	${ deprecatedBottomMargin }
`;

export const GridView = styled.div`
	left: 50%;
	overflow: hidden;
	pointer-events: none;
	position: absolute;
	top: 50%;
	transform: translate3d( -50%, -50%, 0 );
	z-index: 1;

	@media not ( prefers-reduced-motion ) {
		transition: opacity 100ms linear;
	}

	opacity: ${ ( { showOverlay }: { showOverlay?: boolean } ) =>
		showOverlay ? 1 : 0 };
`;

export const GridLine = styled.div`
	background: rgba( 255, 255, 255, 0.4 );
	backdrop-filter: blur( 16px ) saturate( 180% );
	position: absolute;
	transform: translateZ( 0 );
`;

export const GridLineX = styled( GridLine )`
	height: 1px;
	left: 1px;
	right: 1px;
`;

export const GridLineY = styled( GridLine )`
	width: 1px;
	top: 1px;
	bottom: 1px;
`;
