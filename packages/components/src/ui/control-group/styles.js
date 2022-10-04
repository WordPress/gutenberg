/**
 * External dependencies
 */
import { css } from '@emotion/react';

export const first = css`
	border-bottom-right-radius: 0;
	border-top-right-radius: 0;
`;

export const middle = css`
	border-radius: 0;
`;

export const last = css`
	border-bottom-left-radius: 0;
	border-top-left-radius: 0;
`;

export const firstRow = css`
	border-bottom-left-radius: 0;
	border-bottom-right-radius: 0;
`;

export const lastRow = css`
	border-top-left-radius: 0;
	border-top-right-radius: 0;
`;

export const itemFocus = css`
	> * {
		&:focus-within {
			z-index: 1;
		}
	}
`;

export const itemGrid = css`
	> * + *:not( marquee ) {
		margin-left: -1px;
		width: calc( 100% + 1px );
	}
`;
