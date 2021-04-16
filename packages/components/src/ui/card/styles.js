/**
 * External dependencies
 */
import { css, ui } from '@wp-g2/styles';

export const Card = css`
	box-shadow: 0 0 0 1px ${ ui.get( 'surfaceBorderColor' ) };
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
	padding: ${ ui.get( 'cardPadding' ) };
`;

export const InnerBody = css`
	margin-left: calc( ${ ui.get( 'cardPadding' ) } * -1 );
	margin-right: calc( ${ ui.get( 'cardPadding' ) } * -1 );
`;

export const headerFooter = css`
	border-color: ${ ui.get( 'colorDivider' ) };
	min-height: ${ ui.get( 'cardHeaderHeight' ) };
	padding-bottom: ${ ui.get( 'cardHeaderFooterPaddingY' ) };
	padding-left: ${ ui.get( 'cardPaddingX' ) };
	padding-right: ${ ui.get( 'cardPaddingX' ) };
	padding-top: ${ ui.get( 'cardHeaderFooterPaddingY' ) };
`;

export const borderRadius = css`
	&:first-of-type {
		border-top-left-radius: ${ ui.get( 'cardBorderRadius' ) };
		border-top-right-radius: ${ ui.get( 'cardBorderRadius' ) };
	}

	&:last-of-type {
		border-bottom-left-radius: ${ ui.get( 'cardBorderRadius' ) };
		border-bottom-right-radius: ${ ui.get( 'cardBorderRadius' ) };
	}
`;

export const borderless = css`
	box-shadow: none;
`;

export const rounded = css`
	border-radius: ${ ui.get( 'cardBorderRadius' ) };
`;

export const small = css`
	min-height: 30px;
`;

export const medium = css``;

export const xSmall = css`
	min-height: 24px;
`;
