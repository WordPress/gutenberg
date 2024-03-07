/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import type { ThemeOutputValues } from './types';

export const colorVariables = ( { colors }: ThemeOutputValues ) => {
	const shades = Object.entries( colors.gray || {} )
		.map( ( [ k, v ] ) => `--wp-components-color-gray-${ k }: ${ v };` )
		.join( '' );

	return [
		css`
			--wp-components-color-accent: ${ colors.accent };
			--wp-components-color-accent-darker-10: ${ colors.accentDarker10 };
			--wp-components-color-accent-darker-20: ${ colors.accentDarker20 };
			--wp-components-color-accent-inverted: ${ colors.accentInverted };

			--wp-components-color-background: ${ colors.background };
			--wp-components-color-foreground: ${ colors.foreground };
			--wp-components-color-foreground-inverted: ${ colors.foregroundInverted };

			${ shades }
		`,
	];
};

export const Wrapper = styled.div`
	color: var( --wp-components-color-foreground, currentColor );
`;
