/**
 * External dependencies
 */
// Disable reason: Temporarily disable for existing usages
// until we remove them as part of https://github.com/WordPress/gutenberg/issues/30503#deprecating-emotion-css
// eslint-disable-next-line no-restricted-imports
import { css } from '@emotion/css';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { space } from '../ui/utils/space';

// @todo: Maybe abstract to a dedicated UnstyledButton component.
export const unstyledButton = css`
	appearance: none;
	background: none;
	border: 1px solid transparent;
	cursor: pointer;
	text-align: left;

	&:hover {
		color: ${ COLORS.admin };
	}

	&:focus {
		background-color: transparent;
		border-color: ${ COLORS.admin };
		color: ${ COLORS.admin };
		outline: 3px solid transparent;
	}
`;

export const item = css`
	display: block;
	width: 100%;
`;

export const bordered = css`
	border: 1px solid ${ CONFIG.surfaceBorderColor };
`;

export const separated = css`
	> *:not( marquee ) {
		border-bottom: 1px solid ${ CONFIG.surfaceBorderColor };
	}

	> *:last-child:not( :focus ) {
		border-bottom-color: transparent;
	}
`;

export const spacedAround = css`
	border-radius: ${ CONFIG.controlBorderRadius };
`;

export const rounded = css`
	border-radius: ${ CONFIG.controlBorderRadius };

	> *:first-child {
		border-top-left-radius: CONFIG.controlBorderRadius;
		border-top-right-radius: CONFIG.controlBorderRadius;
	}

	> *:last-child {
		border-bottom-left-radius: CONFIG.controlBorderRadius;
		border-bottom-right-radius: CONFIG.controlBorderRadius;
	}
`;

const baseFontHeight = `calc( ${ CONFIG.fontSize } } * ${ CONFIG.fontLineHeightBase })`;

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
		padding-bottom: ${ space( paddingYSmall ) };
		padding-top: ${ space( paddingYSmall ) };
		padding-left: ${ space( CONFIG.controlPaddingXSmall ) };
		padding-right: ${ space( CONFIG.controlPaddingXSmall ) };
	`,
	medium: css`
		padding-bottom: ${ space( paddingY ) };
		padding-top: ${ space( paddingY ) };
		padding-left: ${ space( CONFIG.controlPaddingX ) };
		padding-right: ${ space( CONFIG.controlPaddingX ) };
	`,
	large: css`
		padding-bottom: ${ space( paddingYLarge ) };
		padding-top: ${ space( paddingYLarge ) };
		padding-left: ${ space( CONFIG.controlPaddingXLarge ) };
		padding-right: ${ space( CONFIG.controlPaddingXLarge ) };
	`,
};
