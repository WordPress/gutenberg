/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS, font } from '../utils';

export const unstyledButton = ( as: 'a' | 'button' ) => {
	return css`
		font-size: ${ font( 'default.fontSize' ) };
		font-family: inherit;
		appearance: none;
		border: 1px solid transparent;
		cursor: pointer;
		background: none;
		text-align: start;
		text-decoration: ${ as === 'a' ? 'none' : undefined };

		svg,
		path {
			fill: currentColor;
		}

		&:hover {
			color: ${ COLORS.theme.accent };
		}

		&:focus {
			box-shadow: none;
			outline: none;
		}

		&:focus-visible {
			box-shadow: 0 0 0 var( --wp-admin-border-width-focus )
				${ COLORS.theme.accent };
			// Windows high contrast mode.
			outline: 2px solid transparent;
			outline-offset: 0;
		}
	`;
};

export const itemWrapper = css`
	width: 100%;
	display: block;
`;

export const item = css`
	box-sizing: border-box;
	width: 100%;
	display: block;
	margin: 0;
	color: inherit;
`;

export const bordered = css`
	border: 1px solid ${ CONFIG.surfaceBorderColor };
`;

export const separated = css`
	> *:not( marquee ) > * {
		border-bottom: 1px solid ${ CONFIG.surfaceBorderColor };
	}

	> *:last-of-type > *:not( :focus ) {
		border-bottom-color: transparent;
	}
`;

const borderRadius = CONFIG.controlBorderRadius;

export const spacedAround = css`
	border-radius: ${ borderRadius };
`;

export const rounded = css`
	border-radius: ${ borderRadius };

	> *:first-of-type > * {
		border-top-left-radius: ${ borderRadius };
		border-top-right-radius: ${ borderRadius };
	}

	> *:last-of-type > * {
		border-bottom-left-radius: ${ borderRadius };
		border-bottom-right-radius: ${ borderRadius };
	}
`;

const baseFontHeight = `calc(${ CONFIG.fontSize } * ${ CONFIG.fontLineHeightBase })`;

/*
 * Math:
 * - Use the desired height as the base value
 * - Subtract the computed height of (default) text
 * - Subtract the effects of border
 * - Divide the calculated number by 2, in order to get an individual top/bottom padding
 */
const paddingY = `calc((${ CONFIG.controlHeight } - ${ baseFontHeight } - 2px) / 2)`;
const paddingYSmall = `calc((${ CONFIG.controlHeightSmall } - ${ baseFontHeight } - 2px) / 2)`;
const paddingYLarge = `calc((${ CONFIG.controlHeightLarge } - ${ baseFontHeight } - 2px) / 2)`;

export const itemSizes = {
	small: css`
		padding: ${ paddingYSmall } ${ CONFIG.controlPaddingXSmall };
	`,
	medium: css`
		padding: ${ paddingY } ${ CONFIG.controlPaddingX };
	`,
	large: css`
		padding: ${ paddingYLarge } ${ CONFIG.controlPaddingXLarge };
	`,
};
