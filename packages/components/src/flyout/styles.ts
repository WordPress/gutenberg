/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';
// eslint-disable-next-line no-restricted-imports
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import { Card, CardBody } from '../card';
import * as ZIndex from '../utils/z-index';
import CONFIG from '../utils/config-values';

type FlyoutContentViewProps = {
	maxWidth: CSSProperties[ 'maxWidth' ];
};

export const FlyoutContentView = styled.div< FlyoutContentViewProps >`
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

	${ ( { maxWidth } ) => css( { maxWidth } ) }
`;

export const CardView = styled( Card )`
	${ CardBody.selector } {
		max-height: 80vh;
	}
`;
