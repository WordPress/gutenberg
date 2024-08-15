/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS } from '../utils';
import type { SurfaceVariant, SurfaceProps } from './types';

export const Surface = css`
	background-color: ${ CONFIG.surfaceColor };
	color: ${ COLORS.gray[ 900 ] };
	position: relative;
`;

export const background = css`
	background-color: ${ CONFIG.surfaceBackgroundColor };
`;

export function getBorders( {
	borderBottom,
	borderLeft,
	borderRight,
	borderTop,
}: Pick<
	SurfaceProps,
	'borderBottom' | 'borderLeft' | 'borderRight' | 'borderTop'
> ) {
	const borderStyle = `1px solid ${ CONFIG.surfaceBorderColor }`;

	return css( {
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

const customBackgroundSize = ( surfaceBackgroundSize: string ) =>
	[ surfaceBackgroundSize, surfaceBackgroundSize ].join( ' ' );

const dottedBackground1 = ( surfaceBackgroundSizeDotted: string ) =>
	[
		'90deg',
		[ CONFIG.surfaceBackgroundColor, surfaceBackgroundSizeDotted ].join(
			' '
		),
		'transparent 1%',
	].join( ',' );

const dottedBackground2 = ( surfaceBackgroundSizeDotted: string ) =>
	[
		[ CONFIG.surfaceBackgroundColor, surfaceBackgroundSizeDotted ].join(
			' '
		),
		'transparent 1%',
	].join( ',' );

const dottedBackgroundCombined = ( surfaceBackgroundSizeDotted: string ) =>
	[
		`linear-gradient( ${ dottedBackground1(
			surfaceBackgroundSizeDotted
		) } ) center`,
		`linear-gradient( ${ dottedBackground2(
			surfaceBackgroundSizeDotted
		) } ) center`,
		CONFIG.surfaceBorderBoldColor,
	].join( ',' );

export const getDotted = (
	surfaceBackgroundSize: string,
	surfaceBackgroundSizeDotted: string
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

export const getGrid = ( surfaceBackgroundSize: string ) => {
	return css`
		background: ${ CONFIG.surfaceBackgroundColor };
		background-image: ${ gridBackgroundCombined };
		background-size: ${ customBackgroundSize( surfaceBackgroundSize ) };
	`;
};

export const getVariant = (
	variant: SurfaceVariant,
	surfaceBackgroundSize: string,
	surfaceBackgroundSizeDotted: string
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
