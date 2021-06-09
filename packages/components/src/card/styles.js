/**
 * External dependencies
 */
import { css } from 'emotion';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';

export const Card = css`
	box-shadow: 0 0 0 1px ${ CONFIG.surfaceBorderColor };
	outline: none;
`;

export const Header = css`
	border-bottom: 1px solid;

	&:last-child {
		border-bottom: none;
	}
`;

export const Footer = css`
	border-top: 1px solid;

	&:first-child {
		border-top: none;
	}
`;

export const Content = css`
	height: 100%;
`;

export const Body = css`
	height: auto;
	max-height: 100%;
`;

export const Media = css`
	box-sizing: border-box;
	overflow: hidden;

	& > img,
	& > iframe {
		display: block;
		height: auto;
		max-width: 100%;
		width: 100%;
	}
`;

export const Divider = css`
	box-sizing: border-box;
	display: block;
	width: 100%;
`;

export const borderRadius = css`
	&:first-of-type {
		border-top-left-radius: ${ CONFIG.cardBorderRadius };
		border-top-right-radius: ${ CONFIG.cardBorderRadius };
	}

	&:last-of-type {
		border-bottom-left-radius: ${ CONFIG.cardBorderRadius };
		border-bottom-right-radius: ${ CONFIG.cardBorderRadius };
	}
`;

export const borderColor = css`
	border-color: ${ CONFIG.colorDivider };
`;

export const boxShadowless = css`
	box-shadow: none;
`;

export const borderless = css`
	border: none;
`;

export const rounded = css`
	border-radius: ${ CONFIG.cardBorderRadius };
`;

export const cardPaddings = {
	large: css`
		padding: ${ CONFIG.cardPaddingLarge };
	`,
	medium: css`
		padding: ${ CONFIG.cardPaddingMedium };
	`,
	small: css`
		padding: ${ CONFIG.cardPaddingSmall };
	`,
	xSmall: css`
		padding: ${ CONFIG.cardPaddingXSmall };
	`,
	none: '',
};

export const shady = css`
	background-color: ${ COLORS.lightGray[ 200 ] };
`;
