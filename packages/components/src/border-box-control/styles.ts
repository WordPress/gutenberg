/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG, rtl } from '../utils';
import { space } from '../ui/utils/space';
import { getClampedWidthBorderStyle } from './utils';

import type { Border } from '../border-control/types';
import type { Borders } from './types';

export const BorderBoxControl = css``;

export const LinkedBorderControl = css`
	flex: 1;
`;

export const BorderBoxControlLinkedButton = css`
	flex: 0;
	flex-basis: 36px;
	margin-top: 7px;
`;

export const BorderBoxStyleWithFallback = ( border?: Border ) => {
	return (
		getClampedWidthBorderStyle( border ) ||
		`${ CONFIG.borderWidth } solid ${ COLORS.gray[ 200 ] }`
	);
};

export const BorderBoxControlVisualizer = ( borders?: Borders ) => {
	return css`
		border-top: ${ BorderBoxStyleWithFallback( borders?.top ) };
		border-right: ${ BorderBoxStyleWithFallback( borders?.right ) };
		border-bottom: ${ BorderBoxStyleWithFallback( borders?.bottom ) };
		border-left: ${ BorderBoxStyleWithFallback( borders?.left ) };
		position: absolute;
		top: 20px;
		right: 30px;
		bottom: 20px;
		left: 30px;
	`;
};

export const BorderBoxControlSplitControls = css`
	display: grid;
	position: relative;
	gap: ${ space( 4 ) };
	flex: 1;
	${ rtl( { marginRight: space( 3 ) }, { marginLeft: space( 3 ) } )() }
`;

export const CenteredBorderControl = css`
	grid-column: span 2;
	margin: 0 auto;
`;
