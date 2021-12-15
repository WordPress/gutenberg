/**
 * External dependencies
 */
import styled, { StyledComponent } from '@emotion/styled';
// eslint-disable-next-line no-restricted-imports
import { Popover as ReakitPopover } from 'reakit';

/**
 * Internal dependencies
 */
import { Card, CardBody } from '../card';
import * as ZIndex from '../utils/z-index';
import CONFIG from '../utils/config-values';

export const FlyoutContentView: StyledComponent<
	React.ComponentPropsWithoutRef< typeof ReakitPopover >
> = styled( ReakitPopover )`
	z-index: ${ ZIndex.Flyout };
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

export const CardView = styled( Card )`
	${ CardBody.selector } {
		max-height: 80vh;
	}
`;
