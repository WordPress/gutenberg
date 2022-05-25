/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { Shortcut } from '../shortcut';
import * as ZIndex from '../../utils/z-index';
import CONFIG from '../../utils/config-values';
import { space } from '../utils/space';
import { COLORS } from '../../utils/colors-values';

export const TooltipContent = css`
	z-index: ${ ZIndex.Tooltip };
	box-sizing: border-box;
	opacity: 0;
	outline: none;
	transform-origin: top center;
	transition: opacity ${ CONFIG.transitionDurationFastest } ease;

	&[data-enter] {
		opacity: 1;
	}
`;

export const TooltipPopoverView = styled.div`
	background: rgba( 0, 0, 0, 0.8 );
	border-radius: 2px;
	box-shadow: 0 0 0 1px rgba( 255, 255, 255, 0.04 );
	color: ${ COLORS.white };
	padding: 4px 8px;
`;

export const noOutline = css`
	outline: none;
`;

export const TooltipShortcut = styled( Shortcut )`
	display: inline-block;
	margin-left: ${ space( 1 ) };
`;
