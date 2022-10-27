/**
 * External dependencies
 */
import { colord } from 'colord';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import type { ThemeProps } from './types';
import { COLORS } from '../utils';

const getForegroundForColor = ( color: string ) =>
	colord( color ).isDark() ? COLORS.white : COLORS.gray[ 900 ];

const accentColor = ( { accent }: ThemeProps ) =>
	accent
		? css`
				--wp-components-color-accent: ${ accent };
				--wp-components-color-accent-darker-10: ${ colord( accent )
					.darken( 0.1 )
					.toHex() };
				--wp-components-color-accent-darker-20: ${ colord( accent )
					.darken( 0.2 )
					.toHex() };
				--wp-components-color-accent-inverted: ${ getForegroundForColor(
					accent
				) };
		  `
		: undefined;

function generateShades( background: string, foreground: string ) {
	// Start from #fff (background)
	const shades = {
		// 0: 0,
		100: 0.06,
		200: 0.12,
		300: 0.132,
		400: 0.2,
		600: 0.42,
		700: 0.54,
		800: 0.817,
		// 900: 0.884,
	};

	const result: Record< string, string > = {};
	Object.entries( shades ).forEach( ( [ k, v ] ) => {
		const range =
			( colord( background ).toHsl().l -
				colord( foreground ).toHsl().l ) /
			100;
		const dir = colord( background ).isDark() ? 'lighten' : 'darken';
		result[ k ] = colord( background )
			[ dir ]( v * range )
			.toHex();
	} );

	return result;
}

const backgroundColor = ( { accent, background }: ThemeProps ) => {
	if ( ! background ) return;

	const foreground = getForegroundForColor( background );

	// TODO: Check against default accent color when not provided
	if ( ! colord( background ).isReadable( accent ) ) {
		// eslint-disable-next-line no-console
		console.warn(
			`wp.components.Theme: The background color provided ("${ background }") does not have sufficient contrast against the accent color ("${ accent }").`
		);
	}

	const shades = Object.entries( generateShades( background, foreground ) )
		.map( ( [ k, v ] ) => `--wp-components-color-gray-${ k }: ${ v };` )
		.join( '' );

	return css`
		--wp-components-color-background: ${ background };
		--wp-components-color-foreground: ${ foreground };
		--wp-components-color-foreground-inverted: ${ getForegroundForColor(
			foreground
		) };

		${ shades }
	`;
};

export const Wrapper = styled.div< ThemeProps >`
	${ accentColor }
	${ backgroundColor }
`;
