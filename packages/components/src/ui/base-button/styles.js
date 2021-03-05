/**
 * External dependencies
 */
import { css, ui } from '@wp-g2/styles';

export const Button = css`
	align-items: center;
	appearance: none;
	background-color: transparent;
	border-color: transparent;
	border-radius: ${ ui.get( 'controlBorderRadius' ) };
	border-style: solid;
	border-width: 1px;
	box-shadow: 0 0 0 ${ ui.get( 'controlBoxShadowFocusSize' ) } transparent;
	box-sizing: border-box;
	color: ${ ui.color.text };
	cursor: pointer;
	display: inline-flex;
	font-size: ${ ui.get( 'fontSize' ) };
	height: auto;
	line-height: 1;
	min-height: ${ ui.get( 'controlHeight' ) };
	outline: none;
	padding-bottom: ${ ui.space( 1 ) };
	padding-left: ${ ui.get( 'controlPaddingX' ) };
	padding-right: ${ ui.get( 'controlPaddingX' ) };
	padding-top: ${ ui.space( 1 ) };
	position: relative;
	text-decoration: none;
	touch-action: manipulation; /* Prevents zooming on mobile */
	user-select: none;
	width: auto;

	&:hover,
	&:active,
	&:focus {
		transition: all ${ ui.get( 'transitionDuration' ) }
			cubic-bezier( 0.12, 0.8, 0.32, 1 );
	}

	&[disabled]:not( [aria-busy='true'] ),
	&[aria-disabled='true']:not( [aria-busy='true'] ) {
		${ ui.opacity.muted };
		cursor: auto;
	}

	&:focus {
		box-shadow: ${ ui.get( 'controlBoxShadowFocus' ) };
	}

	&[data-destructive='true'] {
		&:focus {
			box-shadow: ${ ui.get( 'controlDestructiveBoxShadowFocus' ) };
		}
	}

	&[data-icon='true'] {
		min-width: ${ ui.get( 'controlHeight' ) };
	}

	svg {
		display: block;
	}
`;

export const destructive = css`
	color: ${ ui.color.destructive };
`;

export const block = css`
	display: flex;
	width: 100%;
`;

export const rounded = css`
	${ ui.borderRadius.circle };
`;

export const xLarge = css`
	min-height: ${ ui.get( 'controlHeightXLarge' ) };

	&[data-icon='true'] {
		min-width: ${ ui.get( 'controlHeightXLarge' ) };
	}
`;

export const large = css`
	min-height: ${ ui.get( 'controlHeightLarge' ) };

	&[data-icon='true'] {
		min-width: ${ ui.get( 'controlHeightLarge' ) };
	}
`;

export const medium = css``;

export const small = css`
	${ ui.padding.y( ui.space( 0.5 ) ) };
	${ ui.padding.x( ui.get( 'controlPaddingXSmall' ) ) };
	min-height: ${ ui.get( 'controlHeightSmall' ) };

	&[data-icon='true'] {
		min-width: ${ ui.get( 'controlPaddingXSmall' ) };
	}
`;

export const xSmall = css`
	${ ui.padding.y( ui.space( 0.5 ) ) };
	${ ui.padding.x( ui.get( 'controlPaddingXSmall' ) ) };
	min-height: ${ ui.get( 'controlHeightXSmall' ) };

	&[data-icon='true'] {
		min-width: ${ ui.get( 'controlHeightXXSmall' ) };
	}
`;

export const xxSmall = css`
	${ ui.padding( 0 ) };
	min-height: ${ ui.get( 'controlHeightXXSmall' ) };

	&[data-icon='true'] {
		min-width: ${ ui.get( 'controlHeightXXSmall' ) };
	}
`;

export const icon = css`
	${ ui.padding.x( 0 ) };
`;

export const loading = css`
	opacity: 0;
`;

export const Content = css`
	font-size: ${ ui.get( 'fontSize' ) };
	/* line-height: 0; */
	opacity: 1;
`;

export const noWrap = css`
	white-space: nowrap;
`;

export const PrefixSuffix = css`
	opacity: 1;

	svg {
		display: block;
		user-select: none;
	}
`;

export const CaretWrapper = css`
	margin-left: 0 !important;
	position: relative;
	right: ${ ui.space( -2 ) };
`;

export const LoadingOverlay = css`
	bottom: 0;
	left: 0;
	pointer-events: none;
	position: absolute;
	right: 0;
	top: 0;
`;

export const subtle = css`
	border-color: ${ ui.get( 'controlBorderColorSubtle' ) };
	color: ${ ui.color.text };

	&:hover,
	&:active,
	&:focus {
		border-color: ${ ui.get( 'controlBorderColorSubtle' ) };
		color: ${ ui.color.text };
	}

	&:focus {
		border-color: ${ ui.get( 'buttonPrimaryBorderColorFocus' ) };
	}
`;

export const control = css`
	background-color: ${ ui.get( 'controlBackgroundColor' ) };
	border: 1px solid;
	border-color: ${ ui.get( 'controlBorderColor' ) };
	color: ${ ui.color.text };
	font-family: ${ ui.get( 'fontFamily' ) };
	font-size: ${ ui.get( 'fontSize' ) };

	&:hover,
	&:active,
	&:focus {
		color: ${ ui.color.text };
	}

	&:focus {
		border-color: ${ ui.get( 'buttonPrimaryBorderColorFocus' ) };
		box-shadow: ${ ui.get( 'controlBoxShadowFocus' ) };
	}
`;

export const subtleControl = css`
	background-color: transparent;

	&:hover,
	&:focus {
		background-color: ${ ui.get( 'controlBackgroundColor' ) };
	}

	&:focus {
		border-color: ${ ui.get( 'buttonPrimaryBorderColorFocus' ) };
	}

	&:active {
		background-color: ${ ui.get( 'controlBackgroundColorActive' ) };
	}

	&[data-active='true'] {
		background: ${ ui.get( 'colorText' ) };
		color: ${ ui.get( 'colorTextInverted' ) };
	}
`;

export const narrow = css`
	padding-left: ${ ui.get( 'controlPaddingX' ) };
	padding-right: ${ ui.get( 'controlPaddingX' ) };
`;

export const currentColor = css`
	color: currentColor;

	&:hover,
	&:focus {
		color: currentColor;
	}
`;

export const split = css`
	border-bottom-left-radius: 0px;
	border-top-left-radius: 0px;
`;
