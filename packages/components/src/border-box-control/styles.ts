/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG, rtl } from '../utils';
import { space } from '../ui/utils/space';

import type { Border } from '../border-control/types';
import type { Borders } from './types';

export const BorderBoxControl = css``;

export const LinkedBorderControl = css`
	flex: 1;
`;

export const BorderBoxControlLinkedButton = (
	__next36pxDefaultSize?: boolean
) => {
	return css`
		flex: 0;
		flex-basis: 36px;
		margin-top: ${ __next36pxDefaultSize ? '6px' : '3px' };
	`;
};

const BorderBoxStyleWithFallback = ( border?: Border ) => {
	const {
		color = COLORS.gray[ 200 ],
		style = 'solid',
		width = CONFIG.borderWidth,
	} = border || {};

	const clampedWidth =
		width !== CONFIG.borderWidth ? `clamp(1px, ${ width }, 10px)` : width;
	const hasVisibleBorder = ( !! width && width !== '0' ) || !! color;
	const borderStyle = hasVisibleBorder ? style || 'solid' : style;

	return `${ color } ${ borderStyle } ${ clampedWidth }`;
};

export const borderBoxControlVisualizer = (
	borders?: Borders,
	__next36pxDefaultSize?: boolean
) => {
	return css`
		position: absolute;
		top: ${ __next36pxDefaultSize ? '18px' : '15px' };
		right: 30px;
		bottom: ${ __next36pxDefaultSize ? '18px' : '15px' };
		left: 30px;
		border-top: ${ BorderBoxStyleWithFallback( borders?.top ) };
		border-bottom: ${ BorderBoxStyleWithFallback( borders?.bottom ) };
		${ rtl( {
			borderLeft: BorderBoxStyleWithFallback( borders?.left ),
		} )() }
		${ rtl( {
			borderRight: BorderBoxStyleWithFallback( borders?.right ),
		} )() }
	`;
};

export const borderBoxControlSplitControls = () => css`
	position: relative;
	flex: 1;
	${ rtl( { marginRight: space( 3 ) }, { marginLeft: space( 3 ) } )() }
`;

export const CenteredBorderControl = css`
	grid-column: span 2;
	margin: 0 auto;
`;

export const rightBorderControl = () => css`
	${ rtl( { marginLeft: 'auto' }, { marginRight: 'auto' } )() }
`;
