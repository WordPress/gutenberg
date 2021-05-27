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
`;

export const Content = css`
	height: 100%;
`;

export const Body = css`
	height: auto;
	max-height: 100%;
`;

// TODO: should we keep InnerBody?
export const InnerBody = css``;
//	margin-left: calc( ${ CONFIG.cardPadding } * -1 );
//	margin-right: calc( ${ CONFIG.cardPadding } * -1 );
//`;

export const headerFooter = css`
	border-color: ${ CONFIG.colorDivider };
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
};

export const minHeights = {
	large: css`
		min-height: ${ CONFIG.cardHeaderHeightLarge };
	`,
	medium: css`
		min-height: ${ CONFIG.cardHeaderHeightMedium };
	`,
	small: css`
		min-height: ${ CONFIG.cardHeaderHeightSmall };
	`,
	xSmall: css`
		min-height: ${ CONFIG.cardHeaderHeightXSmall };
	`,
};

export const shady = css`
	background-color: ${ COLORS.lightGray[ 200 ] };
`;
