/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

import { colord } from 'colord';

/**
 * Internal dependencies
 */
import type { ThemeProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

const colors = ( { accent }: ThemeProps ) => {
	const accentColor = accent
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

	return accentColor;
};

const Wrapper = styled.div`
	${ colors }
`;

function Theme( props: WordPressComponentProps< ThemeProps, 'div', true > ) {
	return <Wrapper { ...props } />;
}

export default Theme;
