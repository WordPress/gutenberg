/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from 'emotion';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';

export const styleProps = {
	borderColorInternal: COLORS.lightGray[ 500 ],
	borderRadiusInternal: '3px',
};

const { borderColorInternal, borderRadiusInternal } = styleProps;

export const CardUI = styled.div`
	background: ${ COLORS.white };
	box-sizing: border-box;
	border-radius: ${ borderRadiusInternal };
	border: 1px solid ${ borderColorInternal };

	${ handleBorderless };

	&.is-elevated {
		box-shadow: 0px 1px 3px 0px rgba( 0, 0, 0, 0.2 ),
			0px 1px 1px 0px rgba( 0, 0, 0, 0.14 ),
			0px 2px 1px -1px rgba( 0, 0, 0, 0.12 );
	}
`;

export function handleBorderless() {
	return `
		&.is-borderless {
			border: none;
		}
	`;
}

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

export const borderless = css`
	border: none;
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

export const shady = css`
	background-color: ${ COLORS.lightGray[ 200 ] };
`;
