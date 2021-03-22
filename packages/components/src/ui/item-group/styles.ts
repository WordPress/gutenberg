/**
 * External dependencies
 */
import { ui, css } from '@wp-g2/styles';

export const unstyledButton = css`
	border: none;
	appearance: none;
	background: none;
	text-align: left;

	&:hover {
		background-color: ${ ui.get( 'controlBackgroundColorActive' ) };
	}
`;

export const item = css`
	width: 100%;
	display: block;
`;

export const actionItem = css`
	&:hover {
		cursor: pointer;
	}
`;

export const bordered = css`
	${ ui.border.all }
`;

export const separated = css`
	> *:not( marquee ) {
		${ ui.border.bottom }
	}

	> *:last-child {
		border-bottom: none;
	}
`;

const borderRadius = ui.get( 'controlBorderRadius' );

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

const paddingY = `calc((${ ui.get( 'controlHeight' ) } - ${ ui.get(
	'fontSize'
) }) / 2)`;
const paddingYSmall = `calc((${ ui.get( 'controlHeightSmall' ) } - ${ ui.get(
	'fontSize'
) }) / 2)`;
const paddingYLarge = `calc((${ ui.get( 'controlHeightLarge' ) } - ${ ui.get(
	'fontSize'
) }) / 2)`;

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
