/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG, rtl } from '../utils';

import type { Border } from '../border-control/types';
import type { Borders } from './types';

export const borderBoxControl = css``;

export const linkedBorderControl = () => css`
	flex: 1;
	${ rtl( { marginRight: '24px' } )() }
`;

export const wrapper = css`
	position: relative;
`;

export const borderBoxControlLinkedButton = css`
	position: absolute;
	top: 8px;
	${ rtl( { right: 0 } )() }
	line-height: 0;
`;

const borderBoxStyleWithFallback = ( border?: Border ) => {
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

export const borderBoxControlVisualizer = ( borders?: Borders ) => css`
	position: absolute;
	top: 20px;
	right: 39px;
	bottom: 20px;
	left: 39px;
	border-top: ${ borderBoxStyleWithFallback( borders?.top ) };
	border-bottom: ${ borderBoxStyleWithFallback( borders?.bottom ) };
	${ rtl( {
		borderLeft: borderBoxStyleWithFallback( borders?.left ),
	} )() }
	${ rtl( {
		borderRight: borderBoxStyleWithFallback( borders?.right ),
	} )() }
`;

export const borderBoxControlSplitControls = css`
	position: relative;
	flex: 1;
`;

export const centeredBorderControl = css`
	grid-column: span 2;
	margin: 0 auto;
`;

export const rightBorderControl = () => css`
	${ rtl( { marginLeft: 'auto' } )() }
`;
