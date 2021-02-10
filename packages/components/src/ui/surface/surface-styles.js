/**
 * External dependencies
 */
import { css, ui } from '@wp-g2/styles';

export const Surface = css`
	background-color: ${ ui.get( 'surfaceColor' ) };
	color: ${ ui.color.text };
	position: relative;
`;

export const background = css`
	background-color: ${ ui.get( 'surfaceBackgroundColor' ) };
`;

/**
 * @param {Object} props
 * @param {boolean} [props.border]
 * @param {boolean} [props.borderBottom]
 * @param {boolean} [props.borderLeft]
 * @param {boolean} [props.borderRight]
 * @param {boolean} [props.borderTop]
 */
export function getBorders( {
	border,
	borderBottom,
	borderLeft,
	borderRight,
	borderTop,
} ) {
	const borderStyle = `1px solid ${ ui.get( 'surfaceBorderColor' ) }`;

	return css( {
		border: border ? borderStyle : undefined,
		borderBottom: borderBottom ? borderStyle : undefined,
		borderLeft: borderLeft ? borderStyle : undefined,
		borderRight: borderRight ? borderStyle : undefined,
		borderTop: borderTop ? borderStyle : undefined,
	} );
}

export const primary = css``;

export const secondary = css`
	background: ${ ui.get( 'surfaceBackgroundTintColor' ) };
`;

export const tertiary = css`
	background: ${ ui.get( 'surfaceBackgroundTertiaryColor' ) };
`;

const customBackgroundSize = [
	ui.get( 'surfaceBackgroundSize' ),
	ui.get( 'surfaceBackgroundSize' ),
].join( ' ' );

const dottedBackground1 = [
	'90deg',
	[
		ui.get( 'surfaceBackgroundColor' ),
		ui.get( 'surfaceBackgroundSizeDotted' ),
	].join( ' ' ),
	'transparent 1%',
].join( ',' );

const dottedBackground2 = [
	[
		ui.get( 'surfaceBackgroundColor' ),
		ui.get( 'surfaceBackgroundSizeDotted' ),
	].join( ' ' ),
	'transparent 1%',
].join( ',' );

const dottedBackgroundCombined = [
	`linear-gradient( ${ dottedBackground1 } ) center`,
	`linear-gradient( ${ dottedBackground2 } ) center`,
	ui.get( 'surfaceBorderBoldColor' ),
].join( ',' );

export const dotted = css`
	background: ${ dottedBackgroundCombined };
	background-size: ${ customBackgroundSize };
`;

const gridBackground1 = [
	`${ ui.get( 'surfaceBorderSubtleColor' ) } 1px`,
	'transparent 1px',
].join( ',' );

const gridBackground2 = [
	'90deg',
	`${ ui.get( 'surfaceBorderSubtleColor' ) } 1px`,
	'transparent 1px',
].join( ',' );

const gridBackgroundCombined = [
	`linear-gradient( ${ gridBackground1 } )`,
	`linear-gradient( ${ gridBackground2 } )`,
].join( ',' );

export const grid = css`
	background: ${ ui.get( 'surfaceBackgroundColor' ) };
	background-image: ${ gridBackgroundCombined };
	background-size: ${ customBackgroundSize };
`;
