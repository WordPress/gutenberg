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
		  `
		: undefined;

export const Wrapper = styled.div< ThemeProps >`
	${ accentColor }
`;
