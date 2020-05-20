/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import Flex from '../../flex';
import BaseUnitControl from '../../unit-control';
import { color } from '../../utils/style-mixins';

export const MediaWrapper = styled.div`
	background-color: transparent;
	border: 1px solid ${color( 'lightGray.500' )};
	box-sizing: border-box;
	height: 200px;
	padding: 14px;
	width: 100%;
`;

export const MediaContainer = styled.div`
	align-items: center;
	box-sizing: border-box;
	cursor: pointer;
	display: flex;
	height: 100%;
	justify-content: center;
	position: relative;
	width: 100%;

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
	background: ${color( 'lightGray.300' )};
	box-sizing: border-box;
	height: 170px;
	max-width: 280px;
	min-width: 200px;
	width: 100%;
`;

export const UnitControl = styled( BaseUnitControl )`
	width: 72px;
`;

export const ControlWrapper = styled.div`
	box-sizing: border-box;
	max-width: 320px;
	padding: 1em 0;
`;

export const ControlField = styled( Flex )`
	padding-bottom: 12px;

	&:last-child {
		padding-bottom: 0;
	}
`;

export const ControlLabel = styled.label`
	box-sizing: border-box;
	margin: 0;
	padding: 0;
	width: 80px;
`;

export const GridView = styled.div`
	box-sizing: border-box;
	overflow: hidden;
	pointer-events: none;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate( -50%, -50% );
	z-index: 1;
`;

export const GridLine = styled.div`
	box-sizing: border-box;
	background: white;
	box-shadow: 0 0 2px rgba( 0, 0, 0, 0.6 );
	position: absolute;
	opacity: 0.4;
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
