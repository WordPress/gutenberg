/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';

// Since the border for `Card` is rendered via the `box-shadow` property
// (as opposed to the `border` property), the value of the border radius needs
// to be adjusted by removing 1px (this is because the `box-shadow` renders
// as an "outer radius").
const adjustedBorderRadius = `calc(${ CONFIG.radiusLarge } - 1px)`;

export const Card = css`
	box-shadow: 0 0 0 1px ${ CONFIG.surfaceBorderColor };
	outline: none;

	/* Sets the default padding for the card */
	--container-inline-padding: ${ CONFIG.cardPaddingMediumInline };
	--container-block-padding: ${ CONFIG.cardPaddingMediumBlock };
	--container-inline-start-padding: ${ CONFIG.cardPaddingMediumInline };
	--container-inline-end-padding: ${ CONFIG.cardPaddingMediumInline };
`;

/**
 * Sets density-specific padding values for the card.
 * The --density-multiplier variable can be set to scale the padding values.
 */
export const densitySmall = css`
	&[data-density='small'] {
		--density-multiplier: 0.75;
		--container-inline-padding: calc(
			${ CONFIG.cardPaddingSmallInline } * var( --density-multiplier )
		);
		--container-block-padding: calc(
			${ CONFIG.cardPaddingSmallBlock } * var( --density-multiplier )
		);
		--container-inline-start-padding: calc(
			${ CONFIG.cardPaddingSmallInline } * var( --density-multiplier )
		);
		--container-inline-end-padding: calc(
			${ CONFIG.cardPaddingSmallInline } * var( --density-multiplier )
		);
	}
`;

export const densityDefault = css`
	&[data-density='default'] {
		--density-multiplier: 1;
		--container-inline-padding: calc(
			${ CONFIG.cardPaddingMediumInline } * var( --density-multiplier )
		);
		--container-block-padding: calc(
			${ CONFIG.cardPaddingMediumBlock } * var( --density-multiplier )
		);
		--container-inline-start-padding: calc(
			${ CONFIG.cardPaddingMediumInline } * var( --density-multiplier )
		);
		--container-inline-end-padding: calc(
			${ CONFIG.cardPaddingMediumInline } * var( --density-multiplier )
		);
	}
`;

export const densityLarge = css`
	&[data-density='large'] {
		--density-multiplier: 1.25;
		--container-inline-padding: calc(
			${ CONFIG.cardPaddingLargeInline } * var( --density-multiplier )
		);
		--container-block-padding: calc(
			${ CONFIG.cardPaddingLargeBlock } * var( --density-multiplier )
		);
		--container-inline-start-padding: calc(
			${ CONFIG.cardPaddingLargeInline } * var( --density-multiplier )
		);
		--container-inline-end-padding: calc(
			${ CONFIG.cardPaddingLargeInline } * var( --density-multiplier )
		);
	}
`;

export const containerInlinePadding = css`
	padding-inline: var(
		--container-inline-padding,
		${ CONFIG.cardPaddingMediumInline } * var( --density-multiplier )
	);
`;

export const containerBlockPadding = css`
	padding-block: var(
		--container-block-padding,
		${ CONFIG.cardPaddingMediumBlock } * var( --density-multiplier )
	);
`;

export const Header = css`
	border-bottom: 1px solid;
	box-sizing: border-box;

	&:last-child {
		border-bottom: none;
	}
`;

export const Footer = css`
	border-top: 1px solid;
	box-sizing: border-box;

	&:first-of-type {
		border-top: none;
	}
`;

export const Content = css`
	height: 100%;
`;

export const Body = css`
	box-sizing: border-box;
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
		border-top-left-radius: ${ adjustedBorderRadius };
		border-top-right-radius: ${ adjustedBorderRadius };
	}

	&:last-of-type {
		border-bottom-left-radius: ${ adjustedBorderRadius };
		border-bottom-right-radius: ${ adjustedBorderRadius };
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
	border-radius: ${ adjustedBorderRadius };
`;

const xSmallCardPadding = css`
	padding: ${ CONFIG.cardPaddingXSmall };
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
	xSmall: xSmallCardPadding,
	// The `extraSmall` size is not officially documented, but the following styles
	// are kept for legacy reasons to support older values of the `size` prop.
	extraSmall: xSmallCardPadding,
};

export const shady = css`
	background-color: ${ COLORS.ui.backgroundDisabled };
`;
