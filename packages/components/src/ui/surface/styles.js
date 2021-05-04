/**
 * External dependencies
 */
import { css } from '@emotion/css';

/**
 * Internal dependencies
 */
import CONFIG from '../../utils/config-values';
import { COLORS } from '../../utils/colors-values';

export const Surface = css`
	background-color: ${ CONFIG.surfaceColor };
	color: ${ COLORS.black };
	position: relative;
`;

export const background = css`
	background-color: ${ CONFIG.surfaceBackgroundColor };
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
	const borderStyle = `1px solid ${ CONFIG.surfaceBorderColor }`;

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
	background: ${ CONFIG.surfaceBackgroundTintColor };
`;

export const tertiary = css`
	background: ${ CONFIG.surfaceBackgroundTertiaryColor };
`;

/**
 * @param {string} surfaceBackgroundSize
 */
const customBackgroundSize = ( surfaceBackgroundSize ) =>
	[ surfaceBackgroundSize, surfaceBackgroundSize ].join( ' ' );

/**
 * @param {string} surfaceBackgroundSizeDotted
 */
const dottedBackground1 = ( surfaceBackgroundSizeDotted ) =>
	[
		'90deg',
		[ CONFIG.surfaceBackgroundColor, surfaceBackgroundSizeDotted ].join(
			' '
		),
		'transparent 1%',
	].join( ',' );

/**
 * @param {string} surfaceBackgroundSizeDotted
 */
const dottedBackground2 = ( surfaceBackgroundSizeDotted ) =>
	[
		[ CONFIG.surfaceBackgroundColor, surfaceBackgroundSizeDotted ].join(
			' '
		),
		'transparent 1%',
	].join( ',' );

/**
 * @param {string} surfaceBackgroundSizeDotted
 */
const dottedBackgroundCombined = ( surfaceBackgroundSizeDotted ) =>
	[
		`linear-gradient( ${ dottedBackground1(
			surfaceBackgroundSizeDotted
		) } ) center`,
		`linear-gradient( ${ dottedBackground2(
			surfaceBackgroundSizeDotted
		) } ) center`,
		CONFIG.surfaceBorderBoldColor,
	].join( ',' );

/**
 *
 * @param {string} surfaceBackgroundSize
 * @param {string} surfaceBackgroundSizeDotted
 */
export const getDotted = (
	surfaceBackgroundSize,
	surfaceBackgroundSizeDotted
) => css`
	background: ${ dottedBackgroundCombined( surfaceBackgroundSizeDotted ) };
	background-size: ${ customBackgroundSize( surfaceBackgroundSize ) };
`;

const gridBackground1 = [
	`${ CONFIG.surfaceBorderSubtleColor } 1px`,
	'transparent 1px',
].join( ',' );

const gridBackground2 = [
	'90deg',
	`${ CONFIG.surfaceBorderSubtleColor } 1px`,
	'transparent 1px',
].join( ',' );

const gridBackgroundCombined = [
	`linear-gradient( ${ gridBackground1 } )`,
	`linear-gradient( ${ gridBackground2 } )`,
].join( ',' );

/**
 * @param {string} surfaceBackgroundSize
 * @return {string} CSS.
 */
export const getGrid = ( surfaceBackgroundSize ) => {
	return css`
		background: ${ CONFIG.surfaceBackgroundColor };
		background-image: ${ gridBackgroundCombined };
		background-size: ${ customBackgroundSize( surfaceBackgroundSize ) };
	`;
};

/**
 * @param {'dotted' | 'grid' | 'primary' | 'secondary' | 'tertiary'} variant
 * @param {string} surfaceBackgroundSize
 * @param {string} surfaceBackgroundSizeDotted
 */
export const getVariant = (
	variant,
	surfaceBackgroundSize,
	surfaceBackgroundSizeDotted
) => {
	switch ( variant ) {
		case 'dotted': {
			return getDotted(
				surfaceBackgroundSize,
				surfaceBackgroundSizeDotted
			);
		}
		case 'grid': {
			return getGrid( surfaceBackgroundSize );
		}
		case 'primary': {
			return primary;
		}
		case 'secondary': {
			return secondary;
		}
		case 'tertiary': {
			return tertiary;
		}
	}
};
