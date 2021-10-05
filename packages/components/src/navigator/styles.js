/**
 * External dependencies
 */
import { css } from '@emotion/react';

export const gridDeck = css`
	display: grid;
	grid-template: 1fr/1fr;
	> * {
		grid-area: 1/1;
	}
`;
