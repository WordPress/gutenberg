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

export const borderBoxControlLinkedButton = (
	size?: 'default' | '__unstable-large'
) => {
	return css`
		position: absolute;
		top: ${ size === '__unstable-large' ? '8px' : '3px' };
		${ rtl( { right: 0 } )() }
		line-height: 0;
	`;
};

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

export const borderBoxControlVisualizer = (
	borders?: Borders,
	size?: 'default' | '__unstable-large'
) => {
	return css`
		position: absolute;
		top: ${ size === '__unstable-large' ? '20px' : '15px' };
		right: ${ size === '__unstable-large' ? '39px' : '29px' };
		bottom: ${ size === '__unstable-large' ? '20px' : '15px' };
		left: ${ size === '__unstable-large' ? '39px' : '29px' };
		border-top: ${ borderBoxStyleWithFallback( borders?.top ) };
		border-bottom: ${ borderBoxStyleWithFallback( borders?.bottom ) };
		${ rtl( {
			borderLeft: borderBoxStyleWithFallback( borders?.left ),
		} )() }
		${ rtl( {
			borderRight: borderBoxStyleWithFallback( borders?.right ),
		} )() }
	`;
};

export const borderBoxControlSplitControls = (
	size?: 'default' | '__unstable-large'
) => css`
	position: relative;
	flex: 1;
	width: ${ size === '__unstable-large' ? undefined : '80%' };
`;

export const centeredBorderControl = css`
	grid-column: span 2;
	margin: 0 auto;
`;

export const rightBorderControl = () => css`
	${ rtl( { marginLeft: 'auto' } )() }
`;
