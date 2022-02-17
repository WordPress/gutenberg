/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { space } from '../ui/utils/space';

export const BorderBoxControl = css``;

export const LinkedBorderControl = css`
	flex: 1;
`;

export const BorderBoxControlLinkedButton = css`
	flex: 0;
	flex-basis: 36px;
	margin-top: 7px;
`;

export const BorderBoxControlVisualizer = css`
	border: ${ CONFIG.borderWidth } solid ${ COLORS.gray[ 200 ] };
	position: absolute;
	top: 20px;
	right: 30px;
	bottom: 20px;
	left: 30px;
`;

export const BorderBoxControlSplitControls = css`
	display: grid;
	position: relative;
	gap: ${ space( 4 ) };
	flex: 1;
	margin-right: ${ space( 3 ) };
`;

export const CenteredBorderControl = css`
	grid-column: span 2;
	margin: 0 auto;
`;
