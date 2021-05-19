/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { COLORS, rtl } from '../../utils';

const containerPositionStyles = ( { isPositionAbsolute } ) => {
	if ( ! isPositionAbsolute ) return '';

	return css`
		bottom: 0;
		left: 0;
		pointer-events: none;
		position: absolute;
		right: 0;
		top: 0;
		z-index: 1;
	`;
};

export const Container = styled.div`
	box-sizing: border-box;
	position: relative;
	${ containerPositionStyles };
`;

export const Side = styled.div`
	box-sizing: border-box;
	background: ${ COLORS.blue.wordpress[ 700 ] };
	background: ${ COLORS.ui.theme };
	filter: brightness( 1 );
	opacity: 0;
	position: absolute;
	pointer-events: none;
	transition: opacity 120ms linear;
	z-index: 1;

	${ ( { isActive } ) =>
		isActive &&
		`
		opacity: 0.3;
	` }
`;

export const TopView = styled( Side )`
	top: 0;
	left: 0;
	right: 0;
`;

export const RightView = styled( Side )`
	top: 0;
	bottom: 0;
	${ rtl( { right: 0 } ) };
`;

export const BottomView = styled( Side )`
	bottom: 0;
	left: 0;
	right: 0;
`;

export const LeftView = styled( Side )`
	top: 0;
	bottom: 0;
	${ rtl( { left: 0 } ) };
`;
