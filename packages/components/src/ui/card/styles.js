/**
 * External dependencies
 */
import { css } from 'emotion';

/**
 * Internal dependencies
 */
import CONFIG from '../../utils/config-values';

export const Card = css`
	box-shadow: 0 0 0 1px ${ CONFIG.surfaceBorderColor };
	outline: none;
`;

export const Header = css`
	border-bottom: 1px solid;
`;

export const Content = css`
	height: 100%;
`;

export const Body = css`
	height: auto;
	max-height: 100%;
	padding: ${ CONFIG.cardPadding };
`;

export const InnerBody = css`
	margin-left: calc( ${ CONFIG.cardPadding } * -1 );
	margin-right: calc( ${ CONFIG.cardPadding } * -1 );
`;

export const headerFooter = css`
	border-color: ${ CONFIG.colorDivider };
	min-height: ${ CONFIG.cardHeaderHeight };
	padding-bottom: ${ CONFIG.cardHeaderFooterPaddingY };
	padding-left: ${ CONFIG.cardPaddingX };
	padding-right: ${ CONFIG.cardPaddingX };
	padding-top: ${ CONFIG.cardHeaderFooterPaddingY };
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

export const borderless = css`
	box-shadow: none;
`;

export const rounded = css`
	border-radius: ${ CONFIG.cardBorderRadius };
`;

export const small = css`
	min-height: 30px;
`;

export const medium = css``;

export const xSmall = css`
	min-height: 24px;
`;
