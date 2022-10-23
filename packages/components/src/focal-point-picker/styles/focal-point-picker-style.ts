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
import { COLORS } from '../../utils';
import type { FocalPointPickerControlsProps } from '../types';
import { INITIAL_BOUNDS } from '../utils';

export const MediaWrapper = styled.div`
	background-color: transparent;
	text-align: center;
	width: 100%;
`;

export const MediaContainer = styled.div`
	align-items: center;
	box-shadow: 0 0 0 1px rgba( 0, 0, 0, 0.2 );
	cursor: pointer;
	display: inline-flex;
	justify-content: center;
	margin: auto;
	position: relative;
	height: 100%;

	img,
	video {
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
	box-sizing: border-box;
	height: ${ INITIAL_BOUNDS.height }px;
	max-width: 280px;
	min-width: ${ INITIAL_BOUNDS.width }px;
	width: 100%;
`;

export const StyledUnitControl = styled( UnitControl )`
	width: 100px;
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
	transition: opacity 120ms linear;
	z-index: 1;

	opacity: ${ ( { showOverlay }: { showOverlay?: boolean } ) =>
		showOverlay ? 1 : 0 };
`;

export const GridLine = styled.div`
	background: white;
	box-shadow: 0 0 2px rgba( 0, 0, 0, 0.6 );
	position: absolute;
	opacity: 0.4;
	transform: translateZ( 0 );
`;

export const GridLineX = styled( GridLine )`
	height: 1px;
	left: 0;
	right: 0;
`;

export const GridLineY = styled( GridLine )`
	width: 1px;
	top: 0;
	bottom: 0;
`;
