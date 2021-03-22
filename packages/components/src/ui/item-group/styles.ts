/**
 * External dependencies
 */
import { ui, css } from '@wp-g2/styles';

// @todo: Maybe abstract to a dedicated UnstyledButton component.
export const unstyledButton = css`
	appearance: none;
	border: 1px solid transparent;
	cursor: pointer;
	background: none;
	text-align: left;

	&:hover {
		color: ${ ui.get( 'colorAdmin' ) };
	}

	&:focus {
		background-color: transparent;
		color: ${ ui.get( 'colorAdmin' ) };
		border-color: ${ ui.get( 'colorAdmin' ) };
		outline: 3px solid transparent;
	}
`;

export const item = css`
	width: 100%;
	display: block;
`;

export const bordered = css`
	${ ui.border.all }
`;

export const separated = css`
	> *:not( marquee ) {
		${ ui.border.bottom }
	}

	> *:last-child:not( :focus ) {
		border-bottom-color: transparent;
	}
`;

const borderRadius = ui.get( 'controlBorderRadius' );

export const spacedAround = css`
	${ ui.borderRadius( borderRadius ) }
`;

export const rounded = css`
	${ ui.borderRadius( borderRadius ) }

	> *:first-child {
		border-top-left-radius: ${ borderRadius };
		border-top-right-radius: ${ borderRadius };
	}

	> *:last-child {
		border-bottom-left-radius: ${ borderRadius };
		border-bottom-right-radius: ${ borderRadius };
	}
`;

const baseFontHeight = `calc(${ ui.get( 'fontSize' ) } * ${ ui.get(
	'fontLineHeightBase'
) })`;

/*
 * Math:
 * - Use the desired height as the base value
 * - Subtract the computed height of (default) text
 * - Subtract the effects of border
 * - Divide the calculated number by 2, in order to get an individual top/bottom padding
 */
const paddingY = `calc((${ ui.get(
	'controlHeight'
) } - ${ baseFontHeight } - 2px) / 2)`;
const paddingYSmall = `calc((${ ui.get(
	'controlHeightSmall'
) } - ${ baseFontHeight } - 2px) / 2)`;
const paddingYLarge = `calc((${ ui.get(
	'controlHeightLarge'
) } - ${ baseFontHeight } - 2px) / 2)`;

export const itemSizes = {
	small: css`
		${ ui.padding.y( paddingYSmall ) }
		${ ui.padding.x( ui.get( 'controlPaddingXSmall' ) ) }
	`,
	medium: css`
		${ ui.padding.y( paddingY ) }
		${ ui.padding.x( ui.get( 'controlPaddingX' ) ) }
	`,
	large: css`
		${ ui.padding.y( paddingYLarge ) }
		${ ui.padding.x( ui.get( 'controlPaddingXLarge' ) ) }
	`,
};
