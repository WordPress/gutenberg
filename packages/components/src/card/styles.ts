/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { Elevation } from '../elevation';
import { Divider } from '../divider';
import { Flex } from '../flex';
import type {
	Props as CardProps,
	FooterProps,
	BodyProps,
	BaseSubComponentProps,
	HeaderProps,
} from './types';

type CardViewProps = Pick<
	Required< CardProps >,
	'isBorderless' | 'isRounded'
>;

const rounded = css`
	border-radius: ${ CONFIG.cardBorderRadius };
`;

const boxShadowless = css`
	box-shadow: none;
`;

const renderBorderlessCardView = ( { isBorderless }: CardViewProps ) =>
	isBorderless && boxShadowless;

const renderRounded = ( { isRounded }: CardViewProps ) => isRounded && rounded;

export const CardView = styled.div< CardViewProps >`
	box-shadow: 0 0 0 1px ${ CONFIG.surfaceBorderColor };
	outline: none;

	${ renderBorderlessCardView }
	${ renderRounded }

	${ Elevation.selector } {
		${ ( props ) =>
			css( {
				borderRadius: props.isRounded ? CONFIG.cardBorderRadius : 0,
			} ) }
	}
`;

export const CardContentView = styled.div`
	height: 100%;
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

const borderless = css`
	border: none;
`;

const renderBorderless = ( { isBorderless }: { isBorderless: boolean } ) =>
	isBorderless && borderless;

const renderSize = ( { size }: Required< BaseSubComponentProps > ) =>
	cardPaddings[ size ];

const borderRadius = css`
	&:first-of-type {
		border-top-left-radius: ${ CONFIG.cardBorderRadius };
		border-top-right-radius: ${ CONFIG.cardBorderRadius };
	}

	&:last-of-type {
		border-bottom-left-radius: ${ CONFIG.cardBorderRadius };
		border-bottom-right-radius: ${ CONFIG.cardBorderRadius };
	}
`;

const borderColor = css`
	border-color: ${ CONFIG.colorDivider };
`;

const shady = css`
	background-color: ${ COLORS.lightGray[ 200 ] };
`;

const renderShady = ( { isShady }: Required< BaseSubComponentProps > ) =>
	isShady && shady;

export const CardHeaderView = styled.div< Required< HeaderProps > >`
	border-bottom: 1px solid;

	&:last-child {
		border-bottom: none;
	}
	${ borderRadius }
	${ borderColor }
	${ renderSize }
	${ renderBorderless }
	${ renderShady }
`;

export const CardFooterView = styled( Flex )< Required< FooterProps > >`
	border-top: 1px solid;

	&:first-child {
		border-top: none;
	}

	${ borderRadius }
	${ borderColor }
	${ renderSize }
	${ renderBorderless }
`;

export const CardBodyView = styled.div<
	Omit< Required< BodyProps >, 'isScrollable' >
>`
	height: auto;
	max-height: 100%;
	${ borderRadius }
	${ renderSize }
	${ renderShady }
`;

export const CardMediaView = styled.div`
	box-sizing: border-box;
	overflow: hidden;

	& > img,
	& > iframe {
		display: block;
		height: auto;
		max-width: 100%;
		width: 100%;
	}

	${ borderRadius }
`;

export const CardDividerView = styled( Divider )`
	box-sizing: border-box;
	display: block;
	width: 100%;

	${ borderColor }
`;
