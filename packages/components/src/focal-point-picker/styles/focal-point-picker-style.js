/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { Flex } from '../../flex';
import BaseUnitControl from '../../unit-control';
import { COLORS } from '../../utils';

export const MediaWrapper = styled.div`
	background-color: transparent;
	box-sizing: border-box;
	text-align: center;
	width: 100%;
`;

export const MediaContainer = styled.div`
	align-items: center;
	box-sizing: border-box;
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
	background: ${ COLORS.lightGray[ 300 ] };
	box-sizing: border-box;
	height: 170px;
	max-width: 280px;
	min-width: 200px;
	width: 100%;
`;

export const UnitControl = styled( BaseUnitControl )`
	width: 100px;
`;

export const ControlWrapper = styled( Flex )`
	max-width: 320px;
	padding: 1em 0;
`;

export const GridView = styled.div`
	box-sizing: border-box;
	left: 50%;
	opacity: 0;
	overflow: hidden;
	pointer-events: none;
	position: absolute;
	top: 50%;
	transform: translate3d( -50%, -50%, 0 );
	transition: opacity 120ms linear;
	z-index: 1;

	${ ( { isActive } ) =>
		isActive &&
		`
		opacity: 1;
	` }
`;

export const GridLine = styled.div`
	box-sizing: border-box;
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
