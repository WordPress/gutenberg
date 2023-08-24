/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import type { ColorPalette } from './colors';

export const colorVariables = ( colors: ColorPalette ) => {
	const SHADE_MAP: { [ key: string ]: string } = {
		accent: colors.metadata.main,
		warning: 'yellow',
		danger: 'red',
		success: 'green',
		gray: 'gray',
	};

	const ALIAS_MAP: { [ key: string ]: string } = {
		'1': 'background',
		'2': 'background-subtle',
		'3': 'component-background',
		'4': 'component-background-hover',
		'5': 'component-background-active',
		'6': 'border',
		'7': 'component-border',
		'8': 'component-border-hover',
		'9': 'solid',
		'10': 'solid-hover',
		'11': 'text',
		'12': 'contrast',
	};

	const shades = Object.entries( SHADE_MAP || {} )
		.map( ( [ label, name ] ) => {
			if ( name === undefined ) return;
			return Object.entries( colors[ name as keyof ColorPalette ] )
				.map(
					( [ k, v ] ) =>
						`--wp-components-color-${ label }-${ ALIAS_MAP[ k ] }: ${ v };`
				)
				.join( '' );
		} )
		.join( '' );

	console.log( 'shades:', shades );

	return [
		css`
			${ shades }
			color: var(--wp-components-color-gray-text);
		`,
	];
};

export const Wrapper = styled.div``;
