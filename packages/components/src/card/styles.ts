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
	--wp-container-inline-padding: ${ CONFIG.cardPaddingMediumInline };
	--wp-container-block-padding: ${ CONFIG.cardPaddingMediumBlock };
	--wp-container-inline-start-padding: ${ CONFIG.cardPaddingMediumInline };
	--wp-container-inline-end-padding: ${ CONFIG.cardPaddingMediumInline };
`;

export const extraSizeSmall = css`
	&[data-wp-container-size='xSmall'],
	&[data-wp-container-size='extraSmall'] {
		--wp-container-inline-padding: ${ CONFIG.cardPaddingXSmall };
		--wp-container-block-padding: ${ CONFIG.cardPaddingXSmall };
		--wp-container-inline-start-padding: ${ CONFIG.cardPaddingXSmall };
		--wp-container-inline-end-padding: ${ CONFIG.cardPaddingXSmall };
	}
`;

export const sizeSmall = css`
	&[data-wp-container-size='small'] {
		--wp-container-inline-padding: ${ CONFIG.cardPaddingSmallInline };
		--wp-container-block-padding: ${ CONFIG.cardPaddingSmallBlock };
		--wp-container-inline-start-padding: ${ CONFIG.cardPaddingSmallInline };
		--wp-container-inline-end-padding: ${ CONFIG.cardPaddingSmallInline };
	}
`;

export const sizeMedium = css`
	&[data-wp-container-size='medium'] {
		--wp-container-inline-padding: ${ CONFIG.cardPaddingMediumInline };
		--wp-container-block-padding: ${ CONFIG.cardPaddingMediumBlock };
		--wp-container-inline-start-padding: ${ CONFIG.cardPaddingMediumInline };
		--wp-container-inline-end-padding: ${ CONFIG.cardPaddingMediumInline };
	}
`;

export const sizeLarge = css`
	&[data-wp-container-size='large'] {
		--wp-container-inline-padding: ${ CONFIG.cardPaddingLargeInline };
		--wp-container-block-padding: ${ CONFIG.cardPaddingLargeBlock };
		--wp-container-inline-start-padding: ${ CONFIG.cardPaddingLargeInline };
		--wp-container-inline-end-padding: ${ CONFIG.cardPaddingLargeInline };
	}
`;

export const containerInlinePadding = css`
	padding-inline: var(
		--wp-container-inline-padding,
		${ CONFIG.cardPaddingMediumInline }
	);
`;

export const containerBlockPadding = css`
	padding-block: var(
		--wp-container-block-padding,
		${ CONFIG.cardPaddingMediumBlock }
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

export const shady = css`
	background-color: ${ COLORS.ui.backgroundDisabled };
`;
