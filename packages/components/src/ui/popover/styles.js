/**
 * External dependencies
 */
import { css } from '@emotion/css';

/**
 * Internal dependencies
 */
import { CardBody } from '../card';
import * as ZIndex from '../../utils/z-index';
import CONFIG from '../../utils/config-values';

export const PopoverContent = css`
	z-index: ${ ZIndex.Popover };
	box-sizing: border-box;
	opacity: 0;
	outline: none;
	position: relative;
	transform-origin: center center;
	transition: opacity ${ CONFIG.transitionDurationFastest } linear;
	width: 100%;

	&[data-enter] {
		opacity: 1;
	}

	&::before,
	&::after {
		display: none;
	}
`;

export const cardStyle = css`
	${ CardBody.selector } {
		max-height: 80vh;
	}
`;
